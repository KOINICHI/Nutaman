!function ($) {

String.prototype.endsWith = function(word) {
	return this.indexOf(word) == this.length - word.length;
}

var Jobs = function() {
	this.jobs = ['Beginner', 'Knight', 'Berserker', 'Wizard', 'Priest', 'Ranger', 'Heavy Gunner', 'Thief', 'Assassin', 'Rune Blader'];
}
Jobs.prototype.BEGINNER = '0';
Jobs.prototype.KNIGHT = '1';
Jobs.prototype.BERSERKER = '2';
Jobs.prototype.WIZARD = '3';
Jobs.prototype.PRIEST = '4';
Jobs.prototype.RANGER = '5';
Jobs.prototype.HEAVYGUNNER = '6';
Jobs.prototype.THIEF = '7';
Jobs.prototype.ASSASSIN = '8';
Jobs.prototype.RUNEBLADER = '9';
//Jobs.prototype. = 10;
//Jobs.prototype. = 11;


var Player = function(id, job) {
	this.id = id;
	this.job = job;
	this.name = '';
}
Player.prototype.import = function(json) {
	this.id = json.id;
	this.job = json.job;
	this.name = json.name;
}



var Phase = function(id, positions) {
	var that = this;
	
	this.id = id;
	this.players = {};
	$.each(positions, function(i, p) {
		that.players[p] = [];
	});
}
Phase.prototype.getPositionsOfPlayer = function(player) {
	ret = []
	$.each(this.players, function(position, players) {
		if (players.indexOf(player.id) >= 0) {
			ret.push(position.toString());
		}
	});
	return ret;
}
Phase.prototype.import = function(json) {
	this.id = json.id.toString();
	this.players = json.players;
}



var Party = function() {
	this.phase11 = new Phase('11', ['l','m','r']);
	this.phase14 = new Phase('14', ['l','r']);
	this.phase2 = new Phase('2', ['nl','nr', 'sl', 'sr']);
	this.phase4 = new Phase('4', ['nl','nm','nr', 'sl','sm','sr']);
	this.players = []
	this.id_count = 0;
}
Party.prototype.getAllPhases = function() {
	return [this.phase11, this.phase14, this.phase2, this.phase4];
}
Party.prototype.getPhase = function(phase) {
	if (phase == "11") { return this.phase11; }
	if (phase == "14") { return this.phase14; }
	if (phase == "2") { return this.phase2; }
	if (phase == "4") { return this.phase4; }
	return null;
}
Party.prototype.addNewPlayer = function(job) {
	var id = this.id_count.toString();
	this.id_count++;
	var player = new Player(id, job);
	this.players.push(player);
	return this.makePlayerForm(player);
}
Party.prototype.makePlayerForm = function(player) {
	var that = this;
	var id = player.id, job = player.job, name = player.name;
	var $select = $('<select>').addClass('form-control');
	$.each(document.jobs.jobs, function(i, jobname) {
		$select.append($('<option>', {
			selected: i == job ,
			value: i,
			text: jobname }));
	});
	var $name = $('<input>').addClass('form-control')
		.attr('type', 'text')
		.attr('placeholder', 'name')
		.val(name);
	var $delete = $('<button>').addClass('btn')
		.addClass('btn-default')
		.text('\u274c')
	$delete.on('click', function() {
		that.removePlayer(id);
		$(this).parent().remove();
	});
	return $('<li>').attr('data-player-id', id)
		.addClass('form-group')
		.append($name)
		.append($select)
		.append($delete);
}
Party.prototype.removePlayer = function(id) {
	for (var i=0; i<this.players.length; i++) {
		if (this.players[i].id == id) {
			this.players.splice(i, 1);
			break;
		}
	}
}
Party.prototype.removePlayerFromPhase = function(id, phase, position) {
	var players = this.getPhase(phase).players[position];
	players.splice(players.indexOf(id), 1);
}
Party.prototype.getPlayer = function(id) {
	var ret = null;
	for (var i=0; i<this.players.length; i++) {
		if (this.players[i].id == id) {
			ret = this.players[i];
			break;
		}
	}
	return ret;
}
Party.prototype.getPlayerByName = function(name) {
	var ret = null;
	for (var i=0; i<this.players.length; i++) {
		if (this.players[i].name == name) {
			ret = this.players[i];
			break;
		}
	}
	return ret;
}
Party.prototype.makePlayerSelectForm = function(id, phase, position, idx) {
	var that = this;
	var $select = $('<select>').attr('class', 'form-control');
	$.each(this.players, function(i, player) {
		$select.append($('<option>', {
			selected: id == i.toString(),
			value: player.id,
			text: player.name + ' (' + document.jobs.jobs[player.job] + ')'
		}));
	});
	$select.data('idx', idx.toString());
	$select.on('change', function() {
		var players = that.getPhase(phase).players[position];
		players[$(this).data('idx')] = $(this).val();
	});
	var $delete = $('<button>').addClass('btn')
		.addClass('btn-default')
		.text('\u274c')
	$delete.on('click', function() {
		that.removePlayerFromPhase(id, phase, position);
		$(this).parent().remove();
	});
	return $('<li>').addClass('form-group')
		.append($select)
		.append($delete);
}
Party.prototype.updatePlayers = function() {
	var that = this;
	$('#party .player-list li').each( function(i) {
		var html = $(this);
		var player = that.getPlayer(html.data('player-id'));
		player.id = i.toString();
		player.job = html.find(':selected').val();
		player.name = html.find('input[type="text"]').val();
	});
}
Party.prototype.updateForms = function() {
	var that = this;
	$('.block ul').each(function(i, ul) {
		var phase = $(ul).parent().data('phase');
		var position = $(ul).parent().data('position');
		$(ul).empty();
		$.each(that.getPhase(phase).players[position], function(i, p) {
			$(ul).append(that.makePlayerSelectForm(p, phase, position, i));
		});
	});
	
	$('#add-player ul').empty();
	$.each(this.players, function(i, p) {
		$('#add-player ul').append(document.party.makePlayerForm(p))
	});
}

Party.prototype.export = function() {
	return JSON.stringify(this);
}
Party.prototype.import = function(data) {
	var json = JSON.parse(data);
	$.each(this.getAllPhases(), function(i, phase) {
		phase.import(json['phase' + phase.id]);
	});
	this.players = json.players;
}

document.jobs = new Jobs();
document.party = new Party();

$(document).ready(function() {
	if (Cookies.get('name') != undefined) {
		$('#my-name').val(Cookies.get('name'))
	}
	if (Cookies.get('code') != undefined) {
		$('#party-text').val(Cookies.get('code'))
	}
	
	$('.block .btn').on('click', function() {
		var $div = $(this).parent();
		var phase = $div.data('phase');
		var position = $div.data('position');
		
		document.party.getPhase(phase).players[position].push('0');
		var $ul = $(this).siblings().eq(0);
		$ul.append(document.party.makePlayerSelectForm('0', phase, position, $ul.children().length));
	});
	$('#party-submit .btn').on('click', function() {
		var code = $('#party-text').val();
		var name = $('#my-name').val();
		
		if (code == ' ') { return; }
		
		document.party.import(code);
		
		if (name == '') { return; }
		var player = document.party.getPlayerByName(name);
		if (player == null) { return; }
		
		Cookies.set('name', name);
		Cookies.set('code', code);
		var positions = []
		$.each(document.party.getAllPhases(), function(i, phase) {
			positions.push([phase.id]);
			$.each(phase.getPositionsOfPlayer(player), function(j, position) {
				positions[i].push(position);
			});
		});
		$('#my-roles').empty();
		$.each(positions, function(i, val) {
			var phase = val[0].split('');
			var position = val[1] != undefined ? val[1].split('') : ['none'];
			var convertPosition = function(pos) {
				switch (pos) {
					case 'l' : return 'Left';
					case 'm' : return 'Mid';
					case 'r' : return 'Right';
					case 'n' : return 'North';
					case 's' : return 'South';
				}
				return '';
			}
			$('#my-roles').append($('<li>').text(
				'Phase ' + phase.join('-') + ' ' + position.map(convertPosition).join(' ')));
		});
	});
	$('#add-player .btn').on('click', function() {
		$('#party .player-list').append(document.party.addNewPlayer('0'));
	});
	$('.nav-pills a').on('click', function() {
		if (!this.href.endsWith('party')) {
			document.party.updatePlayers();
		}
		document.party.updateForms();
		document.party.export();
	});
	$('.nav-pills a').on('show.bs.tab', function() {
		if ($(event.target).text() == "Home") {
			$('#party-text').text(document.party.export());
			$('#party-submit .btn').trigger('click');
		}
		if ($(event.target).text() == "Share") {
			$('#party-text-share').text(document.party.export());
		}
	});
	$('#my-name').on('keydown', function(e) {
		if (e.which == 13) {
			$('#party-submit .btn').trigger('click');
		}
	});
	$('#party-text').on('click', function() {
		this.select();
	});
	$('#party-text-share').on('click', function() {
		this.select();
	});
	$('#reset-cookie').on('click', function() {
		Cookies.remove('name');
		Cookies.remove('code');
		location.reload();
	});
	
	/* Presetting */
	$('#party-submit .btn').trigger('click');
	$.each("1144890000".split(''), function(i, job) {
		$('#party .player-list').append(document.party.addNewPlayer(job));
	});
	$('.block .btn').each(function(i) {
		var phase = $(this).parent().data('phase');
		var position = $(this).parent().data('position');
		
		if (phase == '11') {
			for (var i=0; i<3; i++) {
				$(this).trigger('click');
			}
			if (position == 'l') {
				$(this).trigger('click');
			}
		}
		if (phase == '14') {
			for (var i=0; i<5; i++) {
				$(this).trigger('click');
			}
		}
		if (phase == '2') {
			for (var i=0; i<2; i++) {
				$(this).trigger('click');
			}
			if (position == 'nr' || position == 'sl') {
				$(this).trigger('click');
			}
		}
		if (phase == '4') {
			$(this).trigger('click');
			if (position == 'nm' || position == 'sl' || position == 'sm') {
				$(this).trigger('click');
			}
			if (position == 'nm') {
				$(this).trigger('click');
			}
		}
	});
});

}(jQuery);