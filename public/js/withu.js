(function (exports) {
  var conn;
  var c;
  exports.connections = null;
  exports.mediaStream = null;
  exports.myConnectAlready = false;
  exports.hisConnectAlready = false;
  var hisVoice;
  var readyCallback = function () {};

  exports.connectionReady = function (callback) {
    readyCallback = callback;
  };

  function setConnection(conn) {
    exports.connections = conn;
    readyCallback();
  }

  var sendWithType = function (type, data) {
    if (!exports.connections) {
      console.warn('do not init connection');
      return;
    }
    exports.connections.send({
      type: type,
      data: data
    });
  };

  function onConnection() {
    exports.connections.on('open', function () {

      myConnectAlready = true;
      var connectData = {
        connectInit: true
      };
      sendWithType('connectData', connectData);

      //exports.connectAlready = true;
      reStart();

      exports.connections.on('data', function (message) {

        switch (message.type) {

        case 'connectData':
          exports.hisConnectAlready = true;
          break;

        case 'colorData':
          mashes[1].hue = message.data.hue;
          break;

        case 'ballData':
          for (var i = 0; i < mashes[1].b.length; i++) {
            mashes[1].b[i].loc.x = message.data.ballPosition[i][0];
            mashes[1].b[i].loc.y = message.data.ballPosition[i][1];
          }
          break;

        case 'upData':
          mashes[1].goUp(message.data.hh);
          //console.log(message.data.hh);
          break;

        case 'rightData':
          mashes[1].addF(right);
          break;

        case 'leftData':
          mashes[1].addF(left);
          break;

        case 'bulletData':
          mashes[1].bullets.push(new Bullet(message.data.bulletX, message
            .data.bulletY, message.data.bulletR, message.data.bulletL));
          break;

        case 'overData':
          over = true;
          break;

        default:
          console.log('unknow message type:', message.type);
        }

      });

    });

    exports.connections.on('close', function () {
      if (!over) {
        mashes.splice(1, 1);
        alert("You're left alone T_T...");
      }
    });

  }
  connectionReady(onConnection);

  var peer = new Peer({
    // host: 'resonate-peer-server.herokuapp.com',
    // port: 80
    key: 'qvjlc339a88jv2t9'
  });

  peer.on('open', function (id) {
    $('#pid').text(id);
  });

  peer.on('connection', function (conn) {
    if (exports.connections) {
      return;
    }
    //peer.removeListener('connection');
    setConnection(conn);
  });

  peer.on('error', function (err) {
    alert(err.message);
  });

  peer.on('call', function (call) {
    call.answer(pitchDetector.audioStream);
    call.on('stream', function (stream) {
      $('#somebodyVoice').prop('src', URL.createObjectURL(stream));
    });
  });

  $(document).ready(function () {

    $('#connect').click(function () {
      if (exports.connections) {
        return;
      }
      c = peer.connect($('#rid').val());
      setConnection(c);

      iAmInit = true;

      var call = peer.call($('#rid').val(), pitchDetector.audioStream);
      call.on('stream', function (stream) {
        $('#somebodyVoice').prop('src', URL.createObjectURL(stream));
      });

    });

  });

  exports.sendWithType = sendWithType;
})(this);