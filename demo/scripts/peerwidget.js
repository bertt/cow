/*$.Cow.ConnectWidget = {
init: function(){
var widget = $('#connect');
var cow = $('#cow').data('cow');
cow.events.bind('connected',{}, this._onConnect);
},
_onConnect: function() {
}
}
*/
(function($) {
$.widget("cow.PeersWidget", {
    options: {
        // The cow.core instance
        core: undefined,
        name: '#myname'
    },
 _create: function() {
        var core;
        var self = this;        
        var element = this.element;
        
        this.peer1;
        this.ls;
        
        element.append('<div id="list"></div>');
        element.append('<div id="peerjs"></div>');
        this.listdiv = element.find('#list');
        this.peerjsdiv = element.find('#peerjs');
        this.peerjsdiv.html('<br>Camera: <input type="checkBox" id="cameraOnOff">');
        
        core = $(this.options.core).data('cow');
        this.core=core;
        core.bind("ws-disconnected", {widget: self}, self._onPeerStoreChanged);
        core.bind("ws-peerInfo", {widget: self}, self._onPeerStoreChanged);
        core.bind("ws-peerGone", {widget: self}, self._onPeerStoreChanged);
        core.bind("peerStoreChanged" ,{widget: self}, self._onPeerStoreChanged);
       
        
        element.delegate('.location','click', function(){
            var owner = $(this).attr('owner');
            var peer = core.getPeerByUid(owner);
            var location = peer.position().point;
            self.core.center({position:location});
        });
        
        element.delegate('.extent','click', function(){
            var owner = $(this).attr('owner');
            var peer = core.getPeerByUid(owner);
            var bbox = peer.view().extent;
            self.core.center({view:bbox});
        });
        
        //Preliminary peerjs video connection
        element.delegate('.videoconnection','click', function(){
            var owner = $(this).attr('owner');
            $('#videoclosebtn').click( function(e){
                console.log("Closing "  + owner);
                tmp = self.peer1;
                self.peer1.managers[owner].close();
                $('#videopanel').hide();
            });
            
            $('#videopanel').show();
            
            mc = self.peer1.call(owner, self.localstream);
            mc.on('stream', function(s){
                window.remote = s;
                  z = $('<video></video>', {src: URL.createObjectURL(s), autoplay: true}).appendTo('#videoplace');
              });
            
         });
        
        element.delegate('.herd','click', function(){
            var herd = $(this).attr('herd');
            self.core.activeHerd = herd;
            if (self.core.me())
                self.core.me().herd({uid: herd});
            self._updateList(self);
            self.core.featurestore().clear(); //Clear featurestore
            //self.core.options.storename = "store_"+herd; //TODO: the link between activeHerd and storename can be better
            self.core.localdbase().loadFromDB();//Fill featurestore with what we have
            
            
        });
        
        this.peerjsdiv.delegate("#cameraOnOff",'click',function(){
                if (this.checked){
                    //Turn on camera stream
                    navigator.getMedia = ( navigator.webkitGetUserMedia ||
                            navigator.getUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);
                    navigator.webkitGetUserMedia({audio: true, video: true}, function(s){
                      self.localstream = s;
                      // Create a new Peer with our demo API key, with debug set to true so we can
                      // see what's going on.
                      self.peer1 = new Peer(self.core.UID, { key: 'lwjd5qra8257b9', debug: true });
                      self.core.me().video({state:"on"});
                      self.peer1.on('call', function(c){
                        c.answer(s);
                      //  c.on('stream', function(s){
                      //    window.s = s;
                      //    z = $('<video></video>', {src: URL.createObjectURL(s), autoplay: true}).appendTo('body');
                      //  });
                      });
                    }, function(){});
                }
                else if (!this.checked){
                    //Turn off camers stream
                    self.core.me().video({state:"off"});
                }

        })
        
        $(this.options.name).change(function(){
            self.core.me().owner({"name":$(this).val()});
            
        });

    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
    
    
    _onPeerStoreChanged: function(evt) {
    console.log('_onNewPeer');
        var self = evt.data.widget;
        self._updateList(self);
    },
    
    _updateList: function(self) {        
        var peers = self.core.peers();
        var herds = [];
        var element = self.element;
        
        $.each(self.core.herds(),function(i) {
            herds[i] = {};
            herds[i].uid = this.uid;
            herds[i].name = this.name;
            herds[i].peers = [];
        });
        $.each(peers,function() {
            var id = this.herd().uid;
            herds[id].peers.push(this);
        });
        var names = '';
        $.each(herds,function() {
            if(this.uid==self.core.activeHerd) {
                names = names + '<span class="peerlist herd me" title="this is your herd" herd="'+this.uid+'">'+this.name+'</span></br>';
            }
            else {
                names = names + '<span class="peerlist herd" title="click to activate this herd" herd="'+this.uid+'">'+this.name+'</span></br>';
            }
            $.each(this.peers, function(){
                if (this.video().state === "on")
                    var videostring = '<img class="videoconnection" owner="'+this.uid+'" src="./css/img/camera.png">';
                else videostring = '';
                if(this.uid==self.core.UID) {
                    names = names+ '<span class="peerlist peer me" title="this is you!" owner="'+this.uid+'">'+this.owner().name+'&nbsp;<img owner="'+this.uid+'" class="location" src="./css/img/crosshair.png"></span></br>';
                    }
                    else {
                    names = names+ '<span class="peerlist peer owner" owner="'+this.uid+'">'+this.owner().name+'&nbsp;<img owner="'+this.uid+'" class="location" src="./css/img/crosshair.png">&nbsp;<img class="extent" owner="'+this.uid+'" src="./css/img/extents.png">&nbsp;'+videostring+'</span></br>';
                    }
            });
        });

        names = names + '<input type="text" id="newHerd">';
        
        
        
        self.listdiv.html(names);
        
    }
    });

})(jQuery);


