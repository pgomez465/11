let myStream
let gcapture
let peer;
let gnumber
let gcontrol
let sendMouse = false

let constraints = {
  audio: true,
  video: true
}

let socket = io()
let fullscreen = false;
let currentCall;


function initialize() {

  //sockets
  socket.on('connect', () => {
    console.log("connected to server")
  })


  socket.on('disconnect', (data) => {
    console.log(data)
  })


  socket.on('onlineUsers', (users) => {
    console.log(users)


    let onlineIDs = users.map(id => id.user)
    console.log(onlineIDs)
    let list = document.querySelector(".onlinelist")

    list.innerHTML = "";
    onlineIDs.forEach(element => {
      var chatIcon = document.createElement('button');
      chatIcon.setAttribute("id", element)
      chatIcon.innerHTML = element
      list.appendChild(chatIcon)
      // let phoneNumber = chatIcon.innerHTML
      chatIcon.addEventListener('click', () => {
        let number = chatIcon.innerHTML
        gnumber = number;
        makeCall(number, myStream)
      })
    })
  })


  //promt user for video permission
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      var videoElement = document.getElementById('thevideo');
      videoElement.srcObject = stream;

      //make stream global using myStream
      myStream = stream;

      videoElement.onloadedmetadata = function() {
        videoElement.play();

      }
    })
    .catch(function(err) {
      alert(err);
    })

  //Global container for id (id is like a phone number)
  var peerId;
  var name;


  //This is necessary (using peerserver.js) file in digitalocean server
  let createName = document.querySelector('#nameButton')
  createName.addEventListener('click', () => {
    name = document.querySelector('#yourName').value
    console.log(name)
    createName.style.display = 'none'


    peer = new Peer(name, {
      host: 'smj470.itp.io',
      port: 9000,
      path: '/'
    })

    peer.on('open', (name) => {
      console.log("my peer id is : " + name)
      socket.emit('users', name)
    })

    peer.on('error', (err) => {
      console.log(err)
    })

    //on the call

    peer.on('call', (incomingCall) => {
      console.log("Got a call");
      currentCall = incomingCall;
      console.log(incomingCall.peer)

      // console.log(incomingCall.metadata);
      let pickupButton = document.querySelector('#pickup')
      let endchatButton = document.querySelector('#endchat')

      if (incomingCall.metadata == 'camera') {
        pickupButton.style.visibility = 'visible';
        pickupButton.innerHTML = currentCall.peer + " is calling - click to pickup"
      }

      if (incomingCall.metadata == 'screen') {
        pickupButton.classList.add('screenshare')
        pickupButton.innerHTML = currentCall.peer + " want to screenshare with you - click to pickup"
      }

      pickupButton.addEventListener('click', () => {
        incomingCall.answer(myStream);
      })

      incomingCall.on('stream', function(remoteStream) {
        if (incomingCall.metadata == 'screen') {
          let control = document.querySelector('.control');
          control.style.visibility = 'visible';
          let othervid = document.getElementById('othervideo').style.width = "87%"
        }
        let control = document.querySelector('.control');
        control.addEventListener('click', () => {
          sendMouse = !sendMouse
          if (sendMouse) {
            mouseLocation();
          }
        })
        endchatButton.style.visibility = 'visible';
        pickupButton.style.visibility = 'hidden';
        var thisVideoElement = document.getElementById('thevideo')
        thisVideoElement.classList.add('active')
        var otherVideoElement = document.getElementById('othervideo');
        otherVideoElement.style.visibility = 'visible';
        otherVideoElement.srcObject = remoteStream;
        otherVideoElement.onloadedmetadata = function() {
          otherVideoElement.play();
        }
        otherVideoElement.addEventListener('click', openfullscreen)
        var flipScreen = document.getElementById('flipvideo')
        flipScreen.classList.add('active')
      });
      var flipScreen = document.getElementById('flipvideo')
      flipScreen.addEventListener('click', flip.bind(this, currentCall.peer))
    });
    let endChat = document.querySelector("#endchat")
    endChat.addEventListener('click', hangup);
  })

}



function makeCall(number, typeofstream) {
  console.log("clicked")
  console.log(typeofstream)
  alert("You are about to call: " + number)
  var call = peer.call(number, typeofstream, {
    "metadata": "camera"
  });
  currentCall = call;

  call.on('stream', function(remoteStream) {
    var otherVideoElement = document.getElementById('othervideo');
    otherVideoElement.style.visibility = 'visible';
    otherVideoElement.srcObject = remoteStream;
    var thisVideoElement = document.getElementById('thevideo')
    thisVideoElement.classList.add('active')
    otherVideoElement.onloadedmetadata = function() {
      otherVideoElement.play();
    }
    otherVideoElement.addEventListener('click', openfullscreen)
  });
  var flipScreen = document.getElementById('flipvideo')
  flipScreen.classList.add('active')
  flipScreen.addEventListener('click', flip.bind(this, currentCall.peer))
  let endChat = document.querySelector("#endchat")
  endChat.style.visibility = 'visible'
}

function hangup() {
  currentCall.close();
  var otherVideoElement = document.getElementById('othervideo');
  otherVideoElement.style.visibility = "hidden";
  var thisVideoElement = document.getElementById('thevideo')
  thisVideoElement.classList.remove('active')
  //remove all buttons
  let endChat = document.querySelector("#endchat")
  endChat.style.visibility = 'hidden'
  let control = document.querySelector('.control');
  control.style.visibility = 'hidden';
  var flipScreen = document.getElementById('flipvideo')
  flipScreen.classList.remove('active')
  let recording = document.querySelector('.recording')
  recording.style.visibility = "hidden"
}

function openfullscreen() {
  var otherVideoElement = document.getElementById('videoCon')
  console.log("Click")
  if (screenfull.enabled) {
    screenfull.request(otherVideoElement);
  } else {
    console.log("DIDNTWORK")
  }
}

function flip(onGoingCall) {
  var flipScreen = document.getElementById('flipvideo')
  flipScreen.classList.remove('active')
  console.log("FLIP")
  navigator.getDisplayMedia({
    video: true
  }).then(capture => {
    var capturevideo = document.getElementById("screencap");
    capturevideo.srcObject = capture;
    console.log("Your Screen is now being captured")
    let recording = document.querySelector('.recording')
    recording.style.visibility = "visible"
    captureCall(onGoingCall, capture, 'screen');
  }, error => {
    console.log('unable to acquire screen' + errer)
  })
}


function captureCall(number, stream) {
  var call = peer.call(number, stream, {
    "metadata": "screen"
  });
  currentCall = call;

  call.on('stream', function(remoteStream) {
    var otherVideoElement = document.getElementById('othervideo');
    otherVideoElement.style.visibility = 'visible';
    otherVideoElement.srcObject = remoteStream;
    var thisVideoElement = document.getElementById('thevideo')
    thisVideoElement.classList.add('active')
    otherVideoElement.onloadedmetadata = function() {
      otherVideoElement.play();
    }
    otherVideoElement.addEventListener('click', openfullscreen)
  });
}

function mouseLocation() {
  document.addEventListener("mousemove", (e) => {
    socket.emit('mouseLocation', {
      x: e.screenX,
      y: e.screenY
    })
  })
}
