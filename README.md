# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

Main page, with linked short URL and URL, URL creation date, visit count, unique visits, edit and delete.

!["Main URL list with linked short URL and URL, URL creation date, visit count, unique visitors, edit and delete"](https://raw.githubusercontent.com/m-wardle/tinyapp/master/docs/url-index.png)

Individual URL view page, with stats and edit option to reassign the URL. Also contains a table of timestamped visits tied to visitor ID.

!["Short URL individual view with edit option to reassign URL and analytics table showing timestamped visits."](https://raw.githubusercontent.com/m-wardle/tinyapp/master/docs/url-edit.png)

URL creation page.

!["Basic URL Creation."](https://raw.githubusercontent.com/m-wardle/tinyapp/master/docs/new-urls-page.png)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.
- Or... [visit TinyApp on Heroku!](https://tinyapp-mwtest.herokuapp.com/)
