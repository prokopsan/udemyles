import React from 'react';
import ReactDOM from 'react-dom';
import Editor from './components/editor';

ReactDOM.render(<Editor/> , document.getElementById('root'));


// function getPageList() {
//    $("h1").remove();
//    $.get("./api", data => {
//        data.forEach(file => {
//            $("body").append(`<h1>${file}</h1>`)
//        })
//    }, "JSON");
// }

// getPageList();

// $("button").on('click', function(){
//     $.post("./api/createNewPage.php", {
//         "name" : $("input").val()
//     }, () =>{
//         getPageList();
//     })
//     .fail(() => {
//         alert("Страница уже существует!");
//     })
// });



// $("button").click(() => {
//     $.post("./api/createNewPage.php", {
//         "name" : $("input").val()
//     }, () => {
//         getPageList();
//     })
//     .fail(() => {
//         alert("Страница уже существует!");
//     })
// });


// class Clock extends React.Component {
//     render() {
//       return (
//         <div>
//           <h1>Hello, world!</h1>
//           <h2>It is {this.props.date.toLocaleTimeString()}.</h2>
//         </div>
//       );
//     }
//   }
  
//   function tick() {
//     ReactDOM.render(
//       <Clock date={new Date()} />,
//       document.getElementById('root')
//     );
//   }
  
//   setInterval(tick, 1000);

