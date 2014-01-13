Concurrent Online WebGIS
========================

COW is a real time multi-user geo-editing application for the browser. The application is based on OpenLayers and jQuery. It uses secure websockets to send changes to its peers and indexeddb to store features in the browser for offline usage.

Currently the server is a normal websocket node.js server behind a haproxy which handles the secure bit.

The core has been tested with jQuery versions 1.8.2 and 1.9.1. The demo client has been tested with jQuery-UI versions 1.9.1 & 1.10.2

API
===
COW is a workspace to concurrently share data with peers over a webscoket. Peers represent the people who connected to the same websocket. It is build around a core object that binds together the syncStores, records and messaging components.
Schematically, it looks like:
-----------
core
    websocket
    peerStore 
        peers
    userStore
        users
    projectStore
        projects
            groupStore
                groups
            itemStore
                items
-----------

All the stores behave the same* and as follows (userStore as example):
    core.users({_id:<string>}) -> adds a record with id, returns record object
    core.users(<string>) -> returns record object with id = <string>
    core.users([<string>]) -> returns array of record objects with matching ids
    core.users()   -> returns array of all record objects
    core.userStore() -> returns the userstore object
    core.userStore().syncRecords() -> syncs all records with status 'dirty'

*: with an exeption of the peerStore that doesn't use an indexedDb 


All *record objects* behave the same* and as follows (user object as example):
    user.id() -> returns the id of the record
    user.status() -> returns the status of the record (being one of  'clean', 'dirty', 'deleted')
    user.status(<string>) -> sets the status of the record, returns record
    user.timestamp() -> returns the timestamp (last edit) of the record
    user.timestamp(<timestamp>) -> sets the timestamp of the record, returns record
    user.data() -> returns the data (object) of the record
    user.data('key', 'value') -> sets a key value pair of the data, returns the record
    user.data({object}) -> sets the data of the record, overrides old data, returns the record
    user.sync() -> syncs the record with the database and with the websocket

**core specific:**
    core.peerid()    -> returns our own peerid
    core.peerid(<string>) -> sets our own peerd
    core.user() -> returns the user object of currently logged on user (false when no user logged on)
    core.user(<string>) -> sets the current users id to the core and to the current peer, returns user object
    core.websocket() -> returns the websocket object
    core.webscoket().disconnect() -> disconnects websocket (auto reconnect in 5 secs)

Since most methods return their own object, the methods are chainable. So you can write rather condensed code:
    var defaultproject = core.projects({_id:1}).data('name',"Sketch").sync();
    var defaultgroup = defaultproject.groups({_id:1}).data('name','Public').sync();
    var firstitem = defaultproject.items({_id:1})
        .data('type','msg')
        .data('creator',core.user().id())
        .sync();

The timestamp and status are automatically updated when invoking the data(<whatever>) method so you don't need to worry about that.


#### Core
>$(selector).cow([options])

**description** initialise Cow and associate it with the matched element. The Cow object is refered to as *cow* in the documentation

[options]: wsUrl (url to the websocket server 
 
* peerid() -- get peerid
* peerid(id) -- set peerid
* project() -- get current project object
* project(id) -- set current project based on id from projectStore
* user() - get current user object
* user(id) - set current user based on id from userStore
* peer() - return my peer object
* location() - get the last known location
* location(location) - set the current location
* projectStore() - returns the _projectstore object
* projects() - returns array of all projects
* projects(id) - returns project with id (or null)
* projects({config}) - creates and returns project
* peerStore() - returns the _peerstore object
* peers() - returns array of all peers
* peers(id) - returns peer with id (or null)
* peers({config}) - creates and returns peer
* userStore() - returns the _userstore object
* users() - returns array of all users
* users(id) - returns user with id (or null)
* users({config}) - creates and returns user
* activeUsers() - returns array with userobjects that are currently active
* websocket() - return the _websocket object


#### Project
>cow.Project(core, [options])

**description** The Project object. It is constructed with the project options object in cow.projects([options]). The Project object is refered to as *project* in the documentation. A Project has a group of zero or more Peers which share items, allowing for collaborative map-editing. There is one special Project, the 'sketch' project, the default, non-removable project; this one deletes features older than a week to prevent cluttering. 

core: the cow object
creating a project: core.projects(newid)

* groupStore() - return groupStore object
* groups() - return array of group objects
* groups(id) - returns group with id
* groups({options}) - creates and returns group object
* itemStore() - return itemStore object
* items() - return array of item objects
* items(id) - returns item with id
* items({options}) - creates and returns item object
* myGroups() - return the group objects that I am member of

#### Group
* members() - return array of member ids
* members(id) - add id to member array, return group object
* members([id]) - add id's to member array, return group object
* removeMember(id) - remove id from array of member id's, return group object
* removeAllMembers() - empty

#### Item
* permissions() will return an array with all permissions set on this item
* permissions('type') will return an array with the permission of type 'type'
* permissions('type',group) will add the group to the permissions 
*     of type 'type' (and create permission of type 'type' if needed), returns item
* permissions('type',[group]) will add the array of groups to the permissions 
    of type 'type' (and create permission of type 'type' if needed), returns item
* permissionsHasGroup(type <string>,group <string>) - function to check if a particular type contains a particular group. Returns true if it is the case, false in all other cases
* hasPermission(<string>) - check to see if current user has <string> permission on item
* removePermission('type') removes the entire permission type from the item
* removePermission('type',[groups]) removes the groups from the permission type

#### Peer
>cow.Peer(core, [options])

**description** The Peer object. It is constructed with the peer options object in cow.peers([options]). The Peer object is refered to as *peer* in the documentation. A Peer is another cow connected to the same websocket server (this can be someone else or the same user, using a different browser)

core: the cow object

* user() - return id of currently connected user
* user(id) - sets id of currently connected user, returns peer object


#### Websocket
>cow.Websocket(core, [options])

**description** The Websocket object. It is constructed with the websocket options object in cow.websocket([options]). The Websocket object is refered to as *ws* in the documentation. The Websocket object contains all the relevant info to make a websocket connection and manages the actual connection.

core: the cow object
[options]: wsUrl

* disconnect() - disconnect us from websocket server
* connect(url) - connect to websocket server on url, returns connection
* connection() - returns connection object
* sendData(data, action, target) - send data to websocket server with params:
            data - json object
            action - string that describes the context of the message
            target - (optional) id of the target peer

Messaging
===
COW makes use of websocket messages to communicate with peers. A peer is not necessarely a COW instance but can be any client that adheres to websocket standards and the COW messaging protocol.
See the <a href='./docs/messaging_shema.png'>image</a> in docs for an overview of the message flow.

### Messages from websocket server
#### connected
webscocket confirms connection by returning a CID
`````javascript
{
    "action": "connected",
    "payload": {"cid":3}
}
`````

Client should: 
    1. assign CID to self. 
    2. Let the world know about self with  'newPeer'
    3. Let the world know about own project with 'projectInfo'
    4. Sent feature idlist to world with 'newPeerFidList'

#### peerGone
the server noticed a peer disconnecting and send its connection-id to the pool
`````javascript
{
    "action":"peerGone",
    "payload":{"peerCid":2,"newCid":2}
}
`````

Client should: remove peer with peerCid from list. Assign newCid to self and sent new Cid to world with 'updatePeers'.

### Messages from Peers: targeted messages
#### informPeer
You joined and receive the status from peers like connection-id, uid, extent
`````javascript
{
    "uid":<origin-id>,
    "target":<target-id>,
    "action":"informPeer",
    "payload":{
        "options":{"uid":<src-uid>,"cid":<src-cid>,"family":"alpha"},
        "view":{"left":<left long>,"bottom":<bottom lat>,"right":<right long>,"top":<top lat>},
        "owner":{"name":<name of peer owner>},
        "position":{"coords":{"longitude":<lon>,"latitude":<lat>},"time":<timestamp>},
        "video":{"state":<on/off>}
    }
}
`````

Client should: add peerinformation to peerslist 

#### syncPeer
The alpha peer sends a sync message with new features and a feature request
`````javascript
{
    "uid":<origin-id>,
    "target":<target-id>,
    "action":"syncPeer",
    "payload":{
        "requestlist":[<feature ids>],
        "pushlist":[<features>],
        "storename":<projectid>
     }
}
`````

Client should:  
    1. sent features from requestlist to other peers with 'requestedFeats' 
    2. add features for own use from pushlist

#### requestedFeats
requested feats are returning from peer
`````javascript
{
    "uid":<origin-id>,
    "action":"requestedFeats",
    "payload":{
        "features":[<features>],
        "storename":<projectid>
    }
}
`````

Client should: add features to own store

### Messages from Peers: broadcasted messages
#### updatePeers
a peer is gone and everybody has a new connection-id, recieve a connectionID with UID
`````javascript
{
    "uid":<origin-id>,
    "action":"updatePeers",
    "payload":{
        "uid":<origin-id>,
        "connectionID":<origin-cid>
    }
}
`````

Client should: update peerlist with new CID's 

#### newPeer
a new peer just joined, recieve its status: connection-id, uid, extent
`````javascript
{
    "uid":<origin-id>,
    "action":"newPeer",
    "payload":{
        "uid":<origin-id>,
        "cid":<origin-cid>,
        "family":"alpha"
     }
}
`````

Client should: 
    1. Add peer to own peerslist
    2. Sent own peerinformation with 'informPeer'
    3. Sent info on own project with 'projectInfo'

#### newPeerFidList
a new peer just sent it's fidlist
`````javascript
{
    "uid":<origin-id>,
    "action":"newPeerFidList",
    "payload":{
        "fids":[<fidlist>],
        "storename":<projectid>
    }
} 
`````

Client should: (only when being the alphapeer) 
    1. Find id's that are new(er) compared to own list and add to requestlist 
    2. Find id's that are old(er) compared to own list and add to pushlist
    3. Sent requestlist and pushlist with 'syncPeer'

#### peerUpdated
A peer has changed, update the peer
`````javascript
{
    "uid":<origin-id>,
    "action":"peerUpdated",
    "payload":{
`````
`````javascript
      "video":{"state":<on/off>}}} 
or    "owner":{"name":<peers owner>}}} 
or    "extent":{"bottom":0,"left":0,"top":1,"right":1}}}
or    "point":{"coords":{"longitude":<lon>,"latitude":<lat>},"time":<timestamp>}
}} 
`````

Client should: update the peer in the peerslist accordingly

#### newFeature
a new object was drawn or updated by a peer
`````javascript
{
    "uid":<origin-id>,
    "action":"newFeature",
    "payload":"{\"options\":<jsonfeature>}"
} 
`````
Client should: add feature to own store
TODO: THERE's SOMETHING WRONG WITH THE JSON HERE, too complex

#### getProjectInfo
>
A peer request information about a project

#### projectInfo
Info about a project comes in...
`````javascript
{
    "uid":<origin-id>,
    "action":"projectInfo",
    "payload":{
        "uid":<projectid>,
        "name":<projectname>,
        "peeruid":<????>,
        "active":<true/false>
    }
}
`````
Not sure what the purpose of peeruid is here 

Client should: ......

Dependencies Core
=================

### jQuery ###
jQuery version 1.10.2

### OpenLayers ###
OpenLayers version 2.12

### jquery.indexeddb.js ###
https://github.com/axemclion/jquery-indexeddb

### D3js ###
D3js version 3


Dependencies Client
===================

### jQuery-UI ###
jQuery-UI version 1.10.2


Known Issues
============



LICENSE
=======

cow is licensed under the MIT license
