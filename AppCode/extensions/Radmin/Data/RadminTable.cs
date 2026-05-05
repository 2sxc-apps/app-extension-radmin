namespace AppCode.Extensions.Radmin.Data
{
  public partial class RadminTable
  {
    public bool DataIsConfigured => !IsEmpty(nameof(DataContentType)) || !IsEmpty(nameof(DataQuery));
  }
}
