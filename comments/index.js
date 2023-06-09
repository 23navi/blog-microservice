const express = require("express");
const { randomBytes } = require("crypto");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
  const id = req.params.id;
  res.send(commentsByPostId[id] || []);
});

app.post("/posts/:id/comments", (req, res) => {
  const commentId = randomBytes(4).toString();
  const postId = req.params.id;
  const comments = commentsByPostId[postId] || [];
  comments.push({
    id: commentId,
    content: req.body.content,
    status: "pending",
  });
  commentsByPostId[postId] = comments;

  axios.post("http://event-bus-srv:4005/events", {
    type: "CommentCreated",
    data: {
      commentId,
      postId,
      content: req.body.content,
      status: "pending",
    },
  });
  res.status(201).send(commentsByPostId[postId]);
});

app.post("/events", async (req, res) => {
  //We will listen for CommentModeration event

  const { type, data } = req.body;

  if (type == "CommentModerated") {
    await axios
      .post("http://event-bus-srv:4005/events", {
        type: "CommentUpdated",
        data,
      })
      .catch((e) => {
        console.log("error on commentUpdate ");
      });
  }
  res.send({});
});

app.listen(4001, () => {
  console.log("Comments on port 4001");
});
