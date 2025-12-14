using Application.Kafka.Events;

namespace Application.Kafka;

public interface IKafkaProducer
{
    Task PublishAsync<T>(string topic, T message, CancellationToken cancellationToken = default) where T : HREvent;
    Task PublishWithKeyAsync<T>(string topic, T message, string key, CancellationToken cancellationToken = default) where T : HREvent;
}
