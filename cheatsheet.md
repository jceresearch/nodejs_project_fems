
Tooling and build processes

Bundler: Parcel
    npm i -D parcel
    alternatively webpack

Linter: 
    ESLint extension, comes with VSCode but needs to make it active
    npm install -D eslint eslint-plugin-import eslint-config-prettier

Prettier
    npm i -D prettier
    Also install the extension in VSCode but needs to configure
    require configuration file
    
Editorconfig
    Create .editorconfig and install the extension in VScode
    Then put there a few recommended cross editor values

D3
    npm i -D d3
    D3 is a library for data visualization
    https://d3js.org/
    
Nodemon
    npm i -D nodemon
    Nodemon is a tool that helps develop node.js based applications by automatically restarting the node application when file changes in the directory are detected.
    https://nodemon.io/
  
REST API dependencies:
  npm i -D  body-parser cors express helmet morgan
  https://hevodata.com/learn/building-a-secure-node-js-rest-api/



GPT
    npm i openai

dotenv
    npm i dotenv
    to inject environment variables into process.env
    needs a .env file in the root of the project with simple 
    KEY=VALUE pairs
    in particular for the openai key you need to create a .env file with
    OPENAI_API_KEY=sk-xxxxx
    and then in the code you can access it with
    process.env.OPENAI_API_KEY, though openai will do it for you
    if you have the key in the environment variable OPENAI_API_KEY
    




# NodeJS project

Frontend masters course on nodejs from zero 
https://frontendmasters.com/courses/node-js-v3/introduction/?q=jest&pid=ehyaBEyiou


## Cheatsheet:

* To install the bundler
  - npm i -D parcel
  - set the script entry in package.json 
    the  --no-cache is to avoid some random error I am getting for which the solution is delete the cache each time it happens , you can skip it
  to run you use:
  
  npm run dev

  and it will create a server that will regenerate and refresh each time you change a file

* Alternative to restart  after each change you can use
  npm install -D nodemon
  Install nodemon to restart the server on each file change  
  then run in the terminal: 
    nodemon .
  but it is not needed if you have parcel!!!


* To install prettier as a styler, remember to install also the prettier extension in VSC, also in settings:
   - format on save
   - require configuration file
   - set prettier as default formatter 
   - create .prettierrc with an {} inside

   npm install -D prettier

Create .editorconfig
  - install the extension for VSC EditorConfig for VSCode
  - check the docs for what you put there, things like indentation etc

Install ESLint
  - check it is in the extensions in VSC
  - npm install -D  eslint eslint-plugin-import  eslint-config-prettier
  - create .eslintrc.json

Install tests framework
  npm install -D jest


Consider using  XState for modeling FSM
  a library for finite state machine


If you want to update all packages to their latest versions regardless of the version ranges specified in your package.json file, you can use the npm-check-updates package. Here's how:

Install npm-check-updates globally by running npm install -g npm-check-updates.

Run ncu -u. This will update all version numbers in your package.json file to their latest versions.

Run npm install to install the updated packages.

