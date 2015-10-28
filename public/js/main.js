(function (exports) {

  var gravity = new PVector(0, 8);
  var left = new PVector(-50, 0);
  var right = new PVector(50, 0);
  var mashes = [];
  var connectCount;
  var hue = 0;
  exports.over = false;
  var userPitch, userVolume;
  exports.iAmInit;
  var animate = true;
  var win;
  //var underLine;

  function beCenter(selector, w, h) {
    var windowWidth = window.innerWidth;
    var gap = (windowWidth - w) / 2;
    var gapString = gap.toString();
    var gapCss = gapString + 'px';
    $(selector).css("margin-left", gapCss);

    if (typeof h !== "undefined") {
      var windowHeight = window.innerHeight;
      var gap2 = (windowHeight - h) / 2;
      var gap2String = gap2.toString();
      var gap2Css = gap2String + 'px';
      $(selector).css("margin-top", gap2Css);
    }
  }

  exports.setup = function () {
    createCanvas(1100, 600);
    beCenter("canvas", width, height);
    beCenter("#intro", width, height);
    beCenter("#word", width, height);
    exports.width = width;
    exports.iAmInit = false;
    exports.boundary = width;
    connectCount = 0;

    smooth();
    frameRate(24);
    colorMode(HSB, 1);

    mashes.push(new Mash(19, 4, 50, width / 2, height / 4));
    hue = mashes[0].hue;
    //underLine = new UnderLine();

    userPitch = new getUserValue(100, 220);
    userVolume = new getUserValue(128, 133);
  };

  exports.reStart = function () {
    animate = false;
    $("#word").hide();
    mashes = [];
    $("#countDown").fadeIn();
    countingDown();

    if (exports.iAmInit) {
      mashes[0] = new Mash(19, 4, 50, width / 6, height / 4);
      mashes[0].hue = hue;
      mashes[1] = new Mash(19, 4, 50, width * 5 / 6, height / 4);
      mashes[1].left = false;
      mashes[1].me = false;
    } else {
      mashes[0] = new Mash(19, 4, 50, width * 5 / 6, height / 4);
      mashes[0].hue = hue;
      mashes[0].left = false;
      mashes[1] = new Mash(19, 4, 50, width / 6, height / 4);
      mashes[1].me = false;
    }
    exports.boundary = width / 2;
    exports.mashes = mashes;
    var colorData = {
      // rr: red,
      // gg: green,
      // bb: blue
      hue: hue
    };
    sendWithType('colorData', colorData);
  };

  exports.draw = function () {
    $(window).resize(function () {
      beCenter(width, "canvas");
      beCenter(width, "#intro");
      beCenter(width, "#word");
    });

    background(0, 0, 1);

    for (var i = 20; i < width; i += 30) {
      for (var j = 20; j < height; j += 30) {
        noStroke();
        fill(0, 0, 0.98);
        rect(i, j, 10, 10);
      }
    }
    if (mashes.length > 1) {
      stroke(0, 0, 0);
      line(width / 2, 0, width / 2, height);
    }

    //underLine.render();

    mashes.forEach(function (item) {
      item.renew();
      item.show();
      item.shoot();
      item.getCenter();
      if (!item.up) {
        item.addF(gravity);
      }
    });
    if (animate) {
      mashes[0].goUp(mapPitch(pitchDetector.pitch));
    }

    if (myConnectAlready && hisConnectAlready) {
      connectCount++;
    }

    if (mashes.length > 1) {
      //if (connectCount % 3 === 0) {
      var ballPos = [];
      mashes[0].b.forEach(function (item) {
        var ballPosPair = [item.loc.x, item.loc.y];
        ballPos.push(ballPosPair);
      });
      var ballData = {
        ballPosition: ballPos
      };
      sendWithType('ballData', ballData);
      //}

      mashes[0].check(mashes[1]);
      mashes[1].check(mashes[0]);
      drawBoundary();
      gameOver();
      mashes.forEach(function (item) {
        if (item.me && !animate) {
          fill(0, 0, 1);
          text("YOU", item.center.x - 10, item.center.y);
        }
      });
      if (animate) {
        fill(1, 1, 1);
        textSize(20);
        if (mashes[0].center.x < width / 2) {
          text("score : " + mashes[0].score, 20, 30);
          text("score : " + mashes[1].score, width - 140, 30);
        } else {
          text("score : " + mashes[1].score, 20, 30);
          text("score : " + mashes[0].score, width - 140, 30);
        }
      }
      //underLine.check(mashes[0].center, mashes[1].center);
    } else {
      //underLine.check(mashes[0].center);
    }

  };

  function mapPitch(input) {
    var pitch;
    if (input < 50 || input > 700 || input === undefined) {
      pitch = 0;
    } else {
      var pitchResult = userPitch.update(input);
      pitch = map(input, pitchResult.mininmum, pitchResult.maxinmum * 0.6, 0,
        86);
      //console.log(pitchResult.mininmum, pitchResult.maxinmum * 0.6);
    }
    pitch = constrain(pitch, 0, 90);
    return pitch;
  }

  function mapVolume(input) {
    var volume;
    if (input < 120 || input > 140 || input === undefined) {
      volume = 0;
    } else {
      var volumeResult = userVolume.update(input);
      if (connectCount > 500) {
        volume = map(input, volumeResult.mininmum + 0.8, volumeResult.maxinmum,
          0,
          25);
      } else {
        volume = map(input, volumeResult.mininmum, volumeResult.maxinmum,
          0,
          37);
      }
      //console.log(volume);
    }
    volume = constrain(volume, 0, 55);
    return volume;
  }

  function drawBoundary() {
    fill(0, 0, 0);
    noStroke();
    if (mashes[0].left) {
      rect(0, 0, mashes[0].hit, height);
      rect(width - mashes[1].hit, 0, mashes[1].hit, height);
    } else {
      rect(0, 0, mashes[1].hit, height);
      rect(width - mashes[0].hit, 0, mashes[0].hit, height);
    }
  }

  function gameOver() {
    if (exports.over) {
      if (mashes[0].score < mashes[1].score) {
        win = false;
      } else {
        win = true;
      }
      playAgain();
    } else {
      mashes.forEach(function (item) {
        if (item.hit >= width / 2 - 20) {
          if (item.me) {
            win = false;
          } else {
            win = true;
          }
          playAgain();
          exports.over = true;
          var overData = {
            overOverOver: true
          };
          sendWithType("overData", overData);
        }
      });
    }
  }

  function playAgain() {
    //setTimeout(function () {}, 2000);
    noLoop();
    //setTimeout(function () {
    $("#cover").show();
    if (win) {
      $("#win").show();
    } else {
      $("#lose").show();
    }
    $("#again").show();
    $("#again").click(function () {
      location.reload();
    });
    //}, 2400);
  }

  function countingDown() {
    setTimeout(
      function () {
        //nothing
      }, 2000);
    setTimeout(
      function () {
        $("#countDown").css("font-size", "60px");
        $("#countDown").css("text-align", "center");
        $("#countDown").html(5);
      }, 3000);
    setTimeout(
      function () {
        $("#countDown").html(4);
      }, 4000);
    setTimeout(
      function () {
        $("#countDown").html(3);
      }, 5000);
    setTimeout(
      function () {
        $("#countDown").html(2);
      }, 6000);
    setTimeout(
      function () {
        $("#countDown").html(1);
      }, 7000);
    setTimeout(
      function () {
        $("#countDown").fadeOut();
        animate = true;
      }, 8000);
  }
  /////////////////////////////////////////////////////////////////

  $(window).keydown(function (event) {
    //event.preventDefault();
    if (event.which === 32) {
      if (!mashes[0].hurt && animate) {
        var r = mapVolume(pitchDetector.volume);
        if (r > 0) {
          mashes[0].bullets.push(new Bullet(mashes[0].center.x, mashes[0].center
            .y,
            r, mashes[0].left));

          if (myConnectAlready && hisConnectAlready) {
            var bulletData = {
              bulletX: mashes[0].center.x,
              bulletY: mashes[0].center.y,
              bulletR: r,
              bulletL: mashes[0].left
            };
            sendWithType('bulletData', bulletData);
          }
        }
      }
    }
  });

  $(window).keydown(function (event) {
    if (event.which === 37) {
      event.preventDefault();
      if (animate) {
        mashes[0].addF(left);
        if (myConnectAlready && hisConnectAlready) {
          var leftData = {
            left: true
          };
          sendWithType('leftData', leftData);
        }
      }
    }
  });

  $(window).keydown(function (event) {
    if (event.which === 39) {
      event.preventDefault();
      if (animate) {
        mashes[0].addF(right);
        if (myConnectAlready && hisConnectAlready) {
          var rightData = {
            right: true
          };
          sendWithType('rightData', rightData);
        }
      }
    }
  });
  exports.right = right;
  exports.left = left;
})(this);