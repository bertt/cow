using System;
using System.Configuration;
using CowSignalR;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin;
using Microsoft.Owin.Cors;
using Owin;
using Microsoft.AspNet.SignalR.Configuration;

[assembly: OwinStartup(typeof(Startup))]
namespace CowSignalR
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.UseFileServer(false);
            app.UseCors(CorsOptions.AllowAll);

            var projects = ConfigurationManager.AppSettings["sockets"];
            foreach(var project in projects.Split(','))
            {
                var resolver= new DefaultDependencyResolver();
                /// Gets or sets the maximum size in bytes of messages sent from client to the server via WebSockets.
                /// Set to null to disable this limit.
                /// The default value is 65536 or 64 KB.
                /// 4MB ==  4194304
                resolver.Resolve<IConfigurationManager>().MaxIncomingWebSocketMessageSize = 4194304;

				resolver.Resolve<IConfigurationManager>().DisconnectTimeout = TimeSpan.FromSeconds(6);
 
                app.MapSignalR(@"/" + project.Trim(), new HubConfiguration { EnableJSONP = true, EnableDetailedErrors = true, Resolver = resolver });
            };
        }
    }
}
