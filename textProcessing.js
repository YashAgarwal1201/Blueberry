
// file for text processing functions

/*const socket = new WebSocket('wss://192.168.29.1:80');

// Connection opened
socket.addEventListener('open', (event) => {
    socket.send('Hello Server!');
});

// Listen for messages
socket.addEventListener('message', (event) => {
    console.log('Message from server ', event.data);
});*/

const network = new brain.NeuralNetwork();
/* Train the Network with 4 input objects
network.train([
  {input:[0,0], output:{zero:1}},
  {input:[0,1], output:{one:1}},
  {input:[1,0], output:{one:1}},
  {input:[1,1], output:{zero:1}},
]);*/
// What is the expected output of [1,0]?
// Display the probability for "zero" and "one"
//console.log( "two: " + resultt["two"] + "\n" + "zero: " + resultt["zero"])

/*const {
    highlight,
    levenMatch
} = dqp
const query = ['interesting', 'words']
  const searchResult = ['some', 'interesting', 'words', 'to', 'remember']

console.log(highlight(query, searchResult))

const index2 = ['return', 'all', 'word', 'matches', 'between', 'two', 'arrays', 'within', 'given', 'levenshtein', 'distance', 'intended', 'use', 'is', 'to', 'words', 'in', 'a', 'query', 'that', 'has', 'an', 'index', 'good', 'for', 'autocomplete', 'type', 'functionality,', 'and', 'some', 'cases', 'also', 'searching']
  const query2 = ['qvery', 'words', 'levensthein']

  console.log(levenMatch(query2, index2, {distance: 2}))*/

function textProcess(argument) {
    let textProcessVar = argument
    textProcessVar = textProcessVar.split('.')
    console.log(textProcessVar)
}
textProcess('open my profile. and display it')