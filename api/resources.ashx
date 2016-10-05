<%@ WebHandler Language="C#" Class="ResourceApiHandler" %>

using System;
using System.Web;
using System.IO;
using System.Linq;

public class ResourceApiHandler : IHttpHandler {

    public void ProcessRequest(HttpContext context) 
    {
		string action = HttpContext.Current.Request["action"];

		if (action == "load-resource-id-list")
		{
			DoLoadResourceIdList();
		}
		else if (action == "save-json-resource")
		{
			DoSaveJsonResource();
		}
    }

    private void DoLoadResourceIdList()
    {
		string folder = HttpContext.Current.Request["folder"];

        string folderPath = GetFolderPath(folder);

        string[] resourceIds = Directory.GetFiles(folderPath, "*.*", SearchOption.AllDirectories)
            .Select(s => s.Replace(folderPath, "").Replace(Path.GetExtension(s), "").Replace("\\", "/"))
            .ToArray();

        string json = "[" + string.Join(", ", resourceIds.Select(id => "\"" + id + "\"").ToArray()) + "]";

        HttpContext.Current.Response.ContentType = "text/json";
        HttpContext.Current.Response.Write(json);
    }

    private void DoSaveJsonResource()
    {
		string folder = HttpContext.Current.Request["folder"];
		string newResourceId = HttpContext.Current.Request["newResourceId"];
		string json = HttpContext.Current.Request["json"];
		string oldResourceId = HttpContext.Current.Request["oldResourceId"];

        string newResourceFilePath = BuildResourceFilePath(folder, newResourceId, ".json");

        string newResourceFolderPath = Path.GetDirectoryName(newResourceFilePath);

        if (!Directory.Exists(newResourceFolderPath))
        {
            Directory.CreateDirectory(newResourceFolderPath);
        }

        File.WriteAllText(newResourceFilePath, json);

        if (!string.IsNullOrWhiteSpace(oldResourceId) && oldResourceId != newResourceId)
        {
            string oldResourceFilePath = BuildResourceFilePath(folder, oldResourceId, ".json");

            if (System.IO.File.Exists(oldResourceFilePath))
            {
                File.Delete(oldResourceFilePath);
            }
        }

        HttpContext.Current.Response.ContentType = "text/plain";
        HttpContext.Current.Response.Write("OK");
    }

    private string GetFolderPath(string folder)
    {
        if (folder.Contains("."))
        {
            throw new Exception("Not so fast, sonny Jim.");
        }

        string folderPath = HttpContext.Current.Server.MapPath("~/resources/" + folder + "/");

        return folderPath;
    }

    private string BuildResourceFilePath(string folder, string resourceId, string fileExtension)
    {
        if (resourceId.Contains("."))
        {
            throw new Exception("Not so fast, sonny Jim.");
        }

        string folderPath = GetFolderPath(folder);

        return folderPath + resourceId.Replace("/", "\\") + fileExtension;
    }

    public bool IsReusable { get { return false; } }
}