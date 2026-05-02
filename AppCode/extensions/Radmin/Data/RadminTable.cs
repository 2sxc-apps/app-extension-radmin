namespace AppCode.Extensions.Radmin.Data
{
  public partial class RadminTable
  {
    public bool DataIsConfigured => !IsEmpty(nameof(DataContentType)) || !IsEmpty(nameof(DataQuery));

    // Patch: This field doesn't exist, and should not be on the model
    // but ATM the model generator doesn't do this correctly.
    // So we patch it here to avoid serialization problems.
    // [JsonIgnore]
    // public bool HasData => base.HasData;
  }
}
