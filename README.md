# TucoChat-CLI
TucoFlyer Chat CLI for administration and parcipitating.

## Setup

 1. Download the packages using `yarn` or `npm install`.
 2. Define environment variables: `TUCOCHAT_CONNECTION_FILE` for specifying the `connection.txt` path.
 3. Run! (`node index.js`)

## Log data types

 * Magenta: data
 * Blue: method
 * Green: OK
 * Red: FAIL
 * Yellow: Warning

## Dependencies

 * chalk: Used for colored console.
 * deasync: Used to wait for needed async functions (like request).
 * request: Used for HTTP requests. (communication w/ Bot-Controller)
 * websocket: Used for websockets. (communication w/ Bot-Controller)

## To-do

 - [ ] Write websocket code.