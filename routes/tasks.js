const router = require("express").Router();
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const sass = require("node-sass-middleware");
const cookieSession = require('cookie-session');
const { walkObject } = require('walk-object');
const {fetchItem } = require('../lib/fetch-item.js');


module.exports = (db) => {
  //GET tasks
  router.get("/", (request, response) => {
    let templateVars = {};
    db.query(`SELECT * FROM users WHERE id = $1`,
      [request.session.user_id])
      .then((data) => {
        templateVars.user = data.rows[0];

        db.query(`SELECT * FROM tasks WHERE user_id = $1`,
          [request.session.user_id])
          .then((data) => {
            templateVars.data = data.rows;
            response.render("tasks", templateVars);
          });
      });
  });

  const movieWords = ['AcademyAward', 'Movie'];
  const foodWords = ['restaurant', 'fast food', 'sandwich'];
  const bookWords = ['Book', "book", "written by", 'author'];

  //POST tasks
  router.post('/', (request, response) => {
    const item = request.body.input;
    fetchItem(item).then(body => {
      let megaString = '';
      console.log(`${item} is the search item `); //delete after
      walkObject(JSON.parse(body).queryresult, ({ value }) => {
        if (typeof value === 'string') megaString += " " + value;
      });

      if (body.error === "Item not found!") {
        console.log("not found");

        //movies
      } else if (movieWords.some(substring => {
        if (megaString.includes(substring)) console.log(substring);
        return megaString.includes(substring);
      })) {
        console.log(`found a movie`);
        db.query(`INSERT INTO tasks(input, category_id, user_id) VALUES($1,$2,$3) RETURNING *;`,
          [request.body.input, categories['film_and_tv_series'], request.session.user_id])
          .then(data => {
            const task = data.rows[0]; //delete after
            response.redirect('/tasks');
          });

        //books
      } else if (bookWords.some(substring => {

        if (megaString.includes(substring)) {
          console.log(substring); //delete after
          return megaString.includes(substring);
        }
      })) {
        console.log(`found a book`);
        db.query(`INSERT INTO tasks(input, category_id, user_id) VALUES($1,$2,$3) RETURNING *;`,
          [request.body.input, categories['books'], request.session.user_id])
          .then(data => {
            const task = data.rows[0]; //delete after
            response.redirect('/tasks');
          });
        //restaurants
      } else if (foodWords.some(substring => megaString.includes(substring))) {
        console.log('found a restaurant');
        db.query(`INSERT INTO tasks(input, category_id, user_id) VALUES($1,$2,$3) RETURNING *;`,
          [request.body.input, categories['restaurants'], request.session.user_id])
          .then(data => {
            const task = data.rows[0]; //delete after
            response.redirect('/tasks');
          });
        // items
      } else {
        console.log(`found a product`);
        db.query(`INSERT INTO tasks(input, category_id, user_id) VALUES($1,$2,$3) RETURNING *;`,
          [request.body.input, categories['products'], request.session.user_id])
          .then(data => {
            const task = data.rows[0];
            response.redirect('/tasks');
          });
      }
    });
  });

  const categories = {};
  db.query(`SELECT id, title FROM categories;`).then(data => {
    for (let row of data.rows) {
      categories[row.title] = row.id;
    }
  });

  return router;
};
