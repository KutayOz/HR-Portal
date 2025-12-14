namespace Application.Kafka;

public class KafkaSettings
{
    public string BootstrapServers { get; set; } = "localhost:9092";
    public string GroupId { get; set; } = "hr-portal-group";
    public string ClientId { get; set; } = "hr-portal-api";
    public bool EnableAutoCommit { get; set; } = true;
    public int SessionTimeoutMs { get; set; } = 6000;
}
