const UIDGenerator = require("uid-generator");
const express = require("express");
const fs = require("fs");

const uidGen = new UIDGenerator();

if (!fs.existsSync("./notes.json")) {
  fs.writeFileSync("./notes.json", JSON.stringify([]), "utf8");
}
const dataCache = JSON.parse(fs.readFileSync("./data.json", "utf8"));
const app = express();

app.use(express.urlencoded());

app.use(express.json());

app.get("/notes", (req, res) => {
  const token = req.headers.authorization;
  if (!isValidToken(token)) {
    res.send(401);
  }
  const notes = getNotes(token);
  res.send(notes);
});

const getId = function(notes) {
  if (notes.length === 0) return 1;
  return notes[notes.length - 1].id + 1;
};

const getIdForNote = function(token) {
  const index = dataCache.findIndex(userData => userData.token === token);
  const newDataCache = [...dataCache];
  return getId(newDataCache[index].notes);
};

app.post("/notes", (req, res) => {
  const { note } = { ...req.body };
  const token = req.headers.authorization;
  if (!isValidToken(token)) {
    res.send(401);
  }

  const index = dataCache.findIndex(userData => userData.token === token);
  const newDataCache = [...dataCache];
  newDataCache[index].notes.push({ ...note, id: getIdForNote(token) });
  fs.writeFile("./data.json", JSON.stringify(newDataCache), "utf8", err => {
    if (!err) {
      res.send();
    }
  });
});

app.delete("/note/:id", (req, res) => {
  const id = req.params.id;
  const token = req.headers.authorization;
  if (!isValidToken(token)) {
    res.send(401);
  }
  const index = dataCache.findIndex(userData => userData.token === token);
  const noteIndex = dataCache[index].notes.findIndex(note => note.id == id);
  const notes = dataCache[index].notes;
  const modifiedNotes = notes
    .slice(0, noteIndex)
    .concat(notes.slice(noteIndex + 1));
  const newDataCache = [...dataCache];
  newDataCache[index].notes = modifiedNotes;
  fs.writeFile("./data.json", JSON.stringify(newDataCache), "utf8", err => {
    if (!err) {
      res.send();
    }
  });
});

const getNotes = function(token) {
  return dataCache.filter(userData => userData.token === token)[0].notes;
};

const isValidUser = function(userName, password) {
  return dataCache.some(
    userData => userData.username === userName && userData.password === password
  );
};

const isValidToken = function(token) {
  return dataCache.some(userData => userData.token === token);
};

const getUserIndex = function(userName, password) {
  return dataCache.findIndex(
    userData => userData.username === userName && userData.password === password
  );
};

app.post("/signup", (req, res) => {
  const { userName, password } = { ...req.body };
  dataCache.push({ username: userName, password, token: "", notes: [] });
  fs.writeFile("./data.json", JSON.stringify(dataCache), "utf8", err => {
    if (!err) {
      res.send();
    }
  });
});

app.post("/login", (req, res) => {
  const { userName, password } = { ...req.body };

  if (!isValidUser(req.body.userName, req.body.password)) {
    res.send(401);
  }

  uidGen.generate().then(uid => {
    const index = getUserIndex(userName, password);
    const newDataCache = [...dataCache];
    newDataCache[index].token = uid;
    fs.writeFile("./data.json", JSON.stringify(newDataCache), "utf8", () => {});
    res.send(JSON.stringify(uid));
  });
});

app.put("/note/:id", (req, res) => {
  const { note } = req.body;
  const id = +req.params.id;
  const token = req.headers.authorization;
  if (!isValidToken(token)) {
    res.send(401);
  }
  const userData = dataCache.find(userData => userData.token === token);
  console.log(userData, "*********");
  userData.notes.forEach(existingNote => {
    console.log(existingNote, "----", note);
    if (existingNote.id === id) {
      existingNote.title = note.title;
      existingNote.description = note.description;
    }
  });
  fs.writeFile("./data.json", JSON.stringify(dataCache), "utf8", err => {
    if (!err) {
      res.send();
    }
  });
});

app.listen(8080, () => {
  console.log("Server listening on port", 8080);
});
