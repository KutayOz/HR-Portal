using System.Text.Json;
using Application.Kafka.Events;
using Confluent.Kafka;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Application.Kafka;

public class KafkaProducer : IKafkaProducer, IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<KafkaProducer> _logger;
    private readonly JsonSerializerOptions _jsonOptions;
    private bool _disposed;

    public KafkaProducer(IOptions<KafkaSettings> settings, ILogger<KafkaProducer> logger)
    {
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        var config = new ProducerConfig
        {
            BootstrapServers = settings.Value.BootstrapServers,
            ClientId = settings.Value.ClientId,
            Acks = Acks.All,
            EnableIdempotence = true,
            MessageSendMaxRetries = 3,
            RetryBackoffMs = 1000
        };

        _producer = new ProducerBuilder<string, string>(config)
            .SetErrorHandler((_, e) => _logger.LogError("Kafka producer error: {Reason}", e.Reason))
            .SetLogHandler((_, log) => _logger.LogDebug("Kafka: {Message}", log.Message))
            .Build();

        _logger.LogInformation("Kafka producer initialized. Bootstrap servers: {Servers}", settings.Value.BootstrapServers);
    }

    public async Task PublishAsync<T>(string topic, T message, CancellationToken cancellationToken = default) where T : HREvent
    {
        await PublishWithKeyAsync(topic, message, message.EventId, cancellationToken);
    }

    public async Task PublishWithKeyAsync<T>(string topic, T message, string key, CancellationToken cancellationToken = default) where T : HREvent
    {
        try
        {
            var jsonMessage = JsonSerializer.Serialize(message, _jsonOptions);
            var kafkaMessage = new Message<string, string>
            {
                Key = key ?? message.EventId,
                Value = jsonMessage,
                Timestamp = new Timestamp(message.Timestamp)
            };

            var result = await _producer.ProduceAsync(topic, kafkaMessage, cancellationToken);

            _logger.LogInformation(
                "Published {EventType} to topic '{Topic}' [Partition: {Partition}, Offset: {Offset}]",
                message.EventType, topic, result.Partition.Value, result.Offset.Value);
        }
        catch (ProduceException<string, string> ex)
        {
            _logger.LogError(ex, "Failed to publish {EventType} to topic '{Topic}'", message.EventType, topic);
            throw;
        }
    }

    public void Dispose()
    {
        if (_disposed) return;
        _producer?.Flush(TimeSpan.FromSeconds(10));
        _producer?.Dispose();
        _disposed = true;
    }
}
