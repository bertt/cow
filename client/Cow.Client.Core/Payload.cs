﻿using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace Cow.Client
{
    public class Payload
    {
        public Payload(EnumItemType syncType, List<string> list,string project =null)
        {
            SyncType = syncType;
            List = list;
            Project = project;
        }
        [JsonProperty(PropertyName = "syncType")]
        public EnumItemType SyncType { get; set; }
        [JsonProperty(PropertyName = "list")]
        public List<String> List { get; set; }
        [JsonProperty(PropertyName = "params")]
        public List<String> Params { get; set; }
        [JsonProperty(PropertyName = "project")]
        public string Project { get; set; }
    }
}
