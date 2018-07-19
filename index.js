var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
	self.init_tcp();
};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.status(1,'Connecting'); // status ok!

	self.init_tcp();
};

instance.prototype.init_tcp = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug("Network error", err);
			self.status(self.STATE_ERROR, err);
			self.log('error',"Network error: " + err.message);
		});

		self.socket.on('connect', function () {
			self.status(self.STATE_OK);
			debug("Connected");
		})

		self.socket.on('data', function (data) {});
	}
};


// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port',
			witdth: 6,
			regex: self.REGEX_PORT
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	debug("destroy", self.id);;
};


instance.prototype.actions = function(system) {
	var self = this;

	self.system.emit('instance_actions', self.id, {
		'play':    { label: 'Play the show (no Cueing)'},
		'cue':     { label: 'Cue the show & wait for the play command'},
		'stop':    { label: 'Stop the show'},
		'rewind':  { label: 'Rewind the show to frame 0'},
		'record':  { label: 'Start recording. Details configured in GUI'},
		'advance': {
			label: 'Step forward n frames (defaults to 1)',
			options: [
 				{
 					 type: 'textinput',
 					 label: 'Number of frames',
 					 id: 'frames',
 					 default: '1'
 				}
 			]
		},
		'stepback': {
			label: 'Step back n frames (defaults to 1)',
			options: [
 				{
 					 type: 'textinput',
 					 label: 'Number of frames',
 					 id: 'frames',
 					 default: '1'
 				}
 			]
		},
		'gotomarker': {
			label: 'Move to a named marker on timeline (optionally play)',
			options: [
 				{
 					 type: 'textinput',
 					 label: 'Marker name',
 					 id: 'marker',
 					 default: ''
 				},
				{
					type: 'dropdown',
					label: 'Goto and play',
					id: 'play',
					choices: [ { id: '', label: 'No Play' }, { id: 'play', label: 'Play' } ]
				}
 			]
		},
		'gotoframe': {
			label: 'Move to the framenumber specified (optionally play)',
			options: [
 				{
 					 type: 'textinput',
 					 label: 'Frame Number',
 					 id: 'frame',
 					 default: ''
 				},
				{
					type: 'dropdown',
					label: 'Goto and play',
					id: 'play',
					choices: [ { id: '', label: 'No Play' }, { id: 'play', label: 'Play' } ]
				}
 			]
		},


	});
};

instance.prototype.action = function(action) {
	var self = this;
	var cmd
	var opt = action.options

	switch (action.action){

		case 'play':
			cmd = 'play';
			break;

		case 'cue':
			cmd = 'cue';
			break;

		case 'stop':
			cmd = 'stop';
			break;

		case 'rewind':
			cmd = 'rewind';
			break;

		case 'record':
			cmd = 'record';
			break;

		case 'advance':
			cmd = 'advance '+ opt.frames;
			break;

		case 'stepback':
			cmd = 'stepback '+ opt.frames;
			break;

		case 'play':
			cmd = 'play';
			break;

		case 'gotomarker':
			cmd = 'gotomarker '+ opt.marker + ' ' + opt.play;
			break;

		case 'gotoframe':
			cmd = 'gotoframe '+ opt.frame + ' ' + opt.play;
			break;



	};




	if (cmd !== undefined) {

		debug('sending ',cmd,"to",self.config.host);

		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(cmd + "\r");
		} else {
			debug('Socket not connected :(');
		}

	}

	// debug('action():', action);

};

instance.module_info = {
	label: '7th Sense Delta',
	id: '7thsensedelta',
	version: '0.0.1'
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
