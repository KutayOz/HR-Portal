using System.Text.Json;
using Application.Kafka.Events;
using Confluent.Kafka;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Application.Kafka;

public class KafkaConsumerService : BackgroundService
{
    private readonly IConsumer<string, string> _consumer;
    private readonly ILogger<KafkaConsumerService> _logger;
    private readonly string[] _topics;
    private readonly JsonSerializerOptions _jsonOptions;

    public KafkaConsumerService(IOptions<KafkaSettings> settings, ILogger<KafkaConsumerService> logger)
    {
        _logger = logger;
        _topics = new[] { KafkaTopics.EmployeeEvents, KafkaTopics.LeaveEvents, KafkaTopics.RecruitmentEvents };
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };

        var config = new ConsumerConfig
        {
            BootstrapServers = settings.Value.BootstrapServers,
            GroupId = settings.Value.GroupId,
            ClientId = $"{settings.Value.ClientId}-consumer",
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = settings.Value.EnableAutoCommit,
            SessionTimeoutMs = settings.Value.SessionTimeoutMs
        };

        _consumer = new ConsumerBuilder<string, string>(config)
            .SetErrorHandler((_, e) => _logger.LogError("Kafka consumer error: {Reason}", e.Reason))
            .SetLogHandler((_, log) => _logger.LogDebug("Kafka: {Message}", log.Message))
            .Build();

        _logger.LogInformation("Kafka consumer initialized. Bootstrap servers: {Servers}, Group: {Group}",
            settings.Value.BootstrapServers, settings.Value.GroupId);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();

        try
        {
            _consumer.Subscribe(_topics);
            _logger.LogInformation("Kafka consumer subscribed to topics: {Topics}", string.Join(", ", _topics));

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var consumeResult = _consumer.Consume(TimeSpan.FromMilliseconds(100));

                    if (consumeResult == null) continue;

                    await ProcessMessageAsync(consumeResult, stoppingToken);
                }
                catch (ConsumeException ex)
                {
                    _logger.LogError(ex, "Kafka consume error");
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Kafka consumer stopping...");
        }
        finally
        {
            _consumer.Close();
            _consumer.Dispose();
        }
    }

    private Task ProcessMessageAsync(ConsumeResult<string, string> result, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Received message from topic '{Topic}' [Partition: {Partition}, Offset: {Offset}]: Key={Key}",
            result.Topic, result.Partition.Value, result.Offset.Value, result.Message.Key);

        try
        {
            var baseEvent = JsonSerializer.Deserialize<HREvent>(result.Message.Value, _jsonOptions);

            if (baseEvent == null)
            {
                _logger.LogWarning("Failed to deserialize message from topic {Topic}", result.Topic);
                return Task.CompletedTask;
            }

            switch (baseEvent.EventType)
            {
                case nameof(EmployeeCreatedEvent):
                    var empCreated = JsonSerializer.Deserialize<EmployeeCreatedEvent>(result.Message.Value, _jsonOptions);
                    _logger.LogInformation("Employee created: {Name} (ID: {Id})", empCreated?.FullName, empCreated?.EmployeeId);
                    break;

                case nameof(EmployeeTerminatedEvent):
                    var empTerminated = JsonSerializer.Deserialize<EmployeeTerminatedEvent>(result.Message.Value, _jsonOptions);
                    _logger.LogInformation("Employee terminated: {Name} (ID: {Id})", empTerminated?.FullName, empTerminated?.EmployeeId);
                    break;

                case nameof(LeaveRequestCreatedEvent):
                    var leaveCreated = JsonSerializer.Deserialize<LeaveRequestCreatedEvent>(result.Message.Value, _jsonOptions);
                    _logger.LogInformation("Leave request created: {Employee} - {Type} ({Days} days)",
                        leaveCreated?.EmployeeName, leaveCreated?.LeaveType, leaveCreated?.NumberOfDays);
                    break;

                case nameof(CandidateHiredEvent):
                    var hired = JsonSerializer.Deserialize<CandidateHiredEvent>(result.Message.Value, _jsonOptions);
                    _logger.LogInformation("Candidate hired: {Name} as {Job}", hired?.FullName, hired?.JobTitle);
                    break;

                default:
                    _logger.LogDebug("Unhandled event type: {EventType}", baseEvent.EventType);
                    break;
            }
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse message from topic {Topic}", result.Topic);
        }

        return Task.CompletedTask;
    }
}
