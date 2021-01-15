// pages/record/record.js
// 两个实例声明在Page之外，方便访问
const recorderManager = wx.getRecorderManager()     //这是录音功能的实例，必须的
const innerAudioContext = wx.createInnerAudioContext();     //这是播放录音功能需要的实例

Page({

  data: {
    tempFilePath: '', //存放录音文件的临时路径
    asrRes: '',
  },
  // 播放录音
  playVoice: function(e) {
    innerAudioContext.onPlay(() => {
      console.log('开始播放')
    })
    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    })
    innerAudioContext.play();

  },
  // 录音
  beginRecord:function(e) {
    // 监听录音开始事件
    recorderManager.onStart(() => {
      console.log('recorder start')
    })
    // 监听已录制完指定帧大小的文件事件。如果设置了 frameSize，则会回调此事件。
    recorderManager.onFrameRecorded((res) => {
      const { frameBuffer } = res
      console.log('frameBuffer.byteLength', frameBuffer.byteLength)
    })
    //录音的参数
    const options = {
      duration: 5000,  //录音时间，默认是60s，提前松手会触发button的bindtouchend事件，执行停止函数并上传录音文件。超过60s不松手会如何并未测试过
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 32000,
      format: 'pcm',      //录音格式，这里是mp3
    }
    //开始录音
    recorderManager.start(options); 
    this.setData({asrRes: ''})   
  },
  //停止录音并上传数据
  endRecord:function(e) {
    const self = this;
    //停止录音
    recorderManager.stop();
    //监听录音停止事件，执行上传录音文件函数
    recorderManager.onStop((res) => {
      console.log('recorder stop', res)

      //返回值res.tempFilePath是录音文件的临时路径 (本地路径)    
      self.setData({
        tempFilePath: res.tempFilePath
      })
      innerAudioContext.src = res.tempFilePath
      //上传录音文件

      var uploadTask = wx.uploadFile({
        //没有method，自动为POST请求
        filePath: res.tempFilePath,
        name: 'file',                  //这个随便填
        url: 'http://121.196.49.33:8000/asr_file/', //填写自己服务器的地址。
        header: {
          "Content-Type": "multipart/form-data" //必须是这个格式
        },
        formData: {'uid': 'wx'},
        success:(e) => {
          console.log('succeed!');
          console.log(e);
          const resData = JSON.parse(e['data']);
          if (resData['code'] === 200){
            self.setData({asrRes: resData['asr']})
          } else {
            self.setData({asrRes: '不好意思，我清不听您说什么'})    
          }
        },
        fail: (e) => {
          console.log('failed!');
          console.log(e);   
          self.setData({asrRes: JSON.stringify(e)})
        }
      });
      uploadTask.onProgressUpdate((e) => {
        console.log(e);
        console.log('期望上传的总字节数：' + e.totalBytesExpectedToSend);
        console.log('已经上传的字节数' + e.totalBytesSent);      
      })
    })
  }

})
