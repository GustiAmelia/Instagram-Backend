import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import Pusher from 'pusher'
import dbModel from './dbModel.js'

// app config
const app = express();
const port = process.env.PORT || 7000;

// middlewares
app.use(express.json())
app.use(cors())

// DB config 
const connection_url = 'mongodb+srv://admin:vI3GHlbOCuldZdME@cluster0.89zaf.mongodb.net/instaDB?retryWrites=true&w=majority'
mongoose.connect(connection_url, {
  useCreateIndex:true,
  useNewUrlParser:true,
  useUnifiedTopology:true
});

const pusher = new Pusher({
  appId: "1243313",
  key: "f15e003c3db80c2956f7",
  secret: "7117fb4ac16b93118b24",
  cluster: "ap1",
  useTLS: true
});

mongoose.connection.once('open', () => {
  console.log('DB Connected')

  const changeStream = mongoose.connection.collection('posts').watch()

  changeStream.on('change', (change) => {
    console.log('ChangeStream Triggered. change...')
    console.log(change)
    console.log('end of chage')

    if (change.operationType === 'insert') {
      console.log('Triggering pusher === Image upload ===')
  
      const postDetails = change.fullDocument;
      pusher.trigger('posts', 'inserted', {
        user : postDetails.user,
        caption : postDetails.caption,
        image : postDetails.image
      })
    } else {
      console.log('Unknown trigger from pusher')
    }
  })
})

// api routes
app.get('/', (req,res) => res.status(200).send('hello Amel'))

app.post('/upload', (req, res) => {
  const body = req.body;

  dbModel.create(body, (err, data) => {
    if(err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data)
    }
  });
});

app.get('/sync', (req,res) => {
  dbModel.find((err, data) => {
    if(err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data)
    }
  })
})

// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`))