const findUserByEmail = function(email, database) {
  for (let i in database) {
    if (email === database[i].email) {
      return database[i].id;
    }
  }

  return undefined;
};


const urlsForUserId = function(id, database) {
  let result = {};

  for (let i in database) {
    if (database[i].userID === id) {
      result[i] = database[i];
    }
  }

  return result;
}


const findUserById = function(userId, database) {
  for (let i in database) {
    if (database[i].id === userId) {
      return database[i]
    }
  }
  
  return false
}

const  generateRandomString = function() {
  let result = '';
   let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
   let charactersLength = characters.length;
   for ( let i = 0; i < 6; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

const analyticsCheck = function(shortURL, database, cookie) {
  if (req.session[shortURL]) {
    database[shortURL]["analytics"][req.session[shortURL]]["counter"]++
  } else {
    let linkCookie = generateRandomString();
    req.session[shortURL] = linkCookie;
    database[shortURL]["analytics"][linkCookie]["counter"] = 1;
  }
}


module.exports = {
  findUserByEmail,
  urlsForUserId,
  findUserById,
  generateRandomString,
}