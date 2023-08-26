import myLogo from './images/myLogo.png';
import TMDBLogo from './images/TMDBLogo.svg'
import './App.css';
import React from 'react';

const API_KEY = "65d5ca8e4353e4c1561fc76bf319cfb7";

class Movies extends React.Component {
  
	constructor(props) {
		super(props);
		this.state = {
		  movie1: null,
		  movie2: null,
		  codes: [],
		  movieRatings: {},
		  unwatchedIDs: {}
		};
		
    this.setup = this.setup.bind(this);
    this.getMovie = this.getMovie.bind(this);
    this.newMatchup = this.newMatchup.bind(this);
    this.updatePoster1 = this.updatePoster1.bind(this);
    this.updatePoster2 = this.updatePoster2.bind(this);
    this.updateMargins = this.updateMargins.bind(this);
    this.oneSelected = this.oneSelected.bind(this);
    this.twoSelected = this.twoSelected.bind(this);
    this.movieSelected = this.movieSelected.bind(this);
    this.sortRatings = this.sortRatings.bind(this);
    this.updateRatings = this.updateRatings.bind(this);
    this.skipMovie1 = this.skipMovie1.bind(this);
    this.skipMovie2 = this.skipMovie2.bind(this);
    
    this.setup();
		
	}
	
	setup() {
	  for (let i = 1; i <= 5; i++) { //temporarily 5, should be 100 but voting would take forever for 1 person
      let page = i;
      let movieListURL = "https://api.themoviedb.org/3/movie/top_rated?api_key="+ API_KEY+ "&language=en-US&page=" + page;
      fetch(movieListURL)
        .then((response) => {
          // make sure the request was successful
          if (response.status != 200) {
            return {
              text: "Error calling the API service: " + response.statusText
            }
          }
          return response.json();
        }).then((json) => {
          // update DOM with response
          for (let movie of json.results) {
            if(movie.adult != true) {
              this.state.codes.push(movie.id);
            }
          }
        });
    }
    console.log(this.state.codes);
	}
	
	getMovie(num) {
	  let randMovieID;
    let opMovieID = 0; //preventing duplicates... doesnt work on first matchup and infinite loops when out of movies (never happens in practice)
    if (this.state.movie1 != null) {
      if (num === 1) {
        opMovieID = this.state.movie2.id;
      }
      else if (num===2) {
        opMovieID = this.state.movie1.id;
      }
    }
    do { //dont love the use of do whiles nested like this
      do {
        randMovieID = this.state.codes[Math.floor(Math.random()*this.state.codes.length)];
      } while (this.state.unwatchedIDs[randMovieID] != null);
    } while (randMovieID == opMovieID); //duplicates can still happen when pressing new matchup(or making a selection) do to asynchronous behavior of promises. probably switch to await
    
    let movieURL = "https://api.themoviedb.org/3/movie/" + randMovieID + "?api_key="+ API_KEY+ "&language=en-US";
    // call API
    fetch(movieURL)
      .then((response) => {
        // make sure the request was successful
        if (response.status != 200) {
          return {
            text: "Error calling the API service: " + response.statusText
          };
        }
        return response.json();
      }).then((json) => {
        // update DOM with response
        if (num === 1) {
          this.setState({ movie1: json }, this.updatePoster1);
          //this.state.movie1 = json;
          //this.updatePoster1();
        }
        else if (num === 2) {
          this.setState({ movie2: json }, this.updatePoster2);
          //this.state.movie2 = json;
          //this.updatePoster2();
        }
      });
  }
	
	newMatchup() {
	    this.getMovie(1);
      this.getMovie(2);
  
      this.updateMargins();
	}
	
  updatePoster1() {
    let posterLink = "https://image.tmdb.org/t/p/w200/" + this.state.movie1.poster_path;
    document.getElementById('poster1').src = posterLink;
    document.getElementById('movieTitle1').innerHTML = this.state.movie1.title; // TODO: add year and original_title
  }
  
  updatePoster2() {
    let posterLink = "https://image.tmdb.org/t/p/w200/" + this.state.movie2.poster_path;
    document.getElementById('poster2').src = posterLink;
    document.getElementById('movieTitle2').innerHTML = this.state.movie2.title; 
  }
  
  updateMargins() {
    let movies = document.getElementById('movies');
    movies.style.marginTop = "20px";
    movies.style.marginBottom = "20px";
    movies.style.display = 'grid';
  }
  
  oneSelected() {
    this.movieSelected(1);
  }

  twoSelected() {
    this.movieSelected(2);
  }

  movieSelected(number) {
    console.log(this.state.movie1);
    console.log(this.state.movie2);
    let movie;
    let loser;
  
    if (number === 1) {
      movie = this.state.movie1;
      loser = this.state.movie2;
    }
    else if (number === 2) {
      movie = this.state.movie2;
      loser = this.state.movie1;
    }
      
    var values;
    if (this.state.movieRatings[movie.id] != null) {
      values = this.state.movieRatings[movie.id];
      values.value += 1;
      values.votes += 1;
    }
    else {
      values = {value: 1, votes: 1};
      values.title = movie.title;
    }
    this.state.movieRatings[movie.id] = values;
    
    if (this.state.movieRatings[loser.id] != null) {
      values = this.state.movieRatings[loser.id];
      values.value -= 1;
      values.votes += 1;
    }
    else {
      values = {value: 0, votes: 1};
      values.title = loser.title;
    }
    this.state.movieRatings[loser.id] = values;
    
    //console.log(JSON.stringify(toParse));
    console.log(this.state.movieRatings);
    this.updateRatings();
    this.newMatchup();
  }

  sortRatings(obj) {
    var sortedEntries = Object.entries(obj).sort(function(a,b){return b[1].value-a[1].value});
    return sortedEntries;
  }

  updateRatings() {
    document.getElementById("ratings").innerHTML = "";
    document.getElementById("ratingTitle").style.marginBottom = "0px";
    
    let sortedRatings = this.sortRatings(this.state.movieRatings);
    console.log(sortedRatings);
    //let end = Math.min(10, sortedRatings.length);
    let end = sortedRatings.length;
    for (let i = 0; i < end; i++) {
        let ratingToAdd = '<p>' + (i+1) + ': ' + sortedRatings[i][1].title + '</p>';
        document.getElementById("ratings").innerHTML += ratingToAdd;
    }
  }

  skipMovie1(e) {
    this.state.unwatchedIDs[this.state.movie1.id] = 0;
    this.getMovie(1);
  }

  skipMovie2(e) {
    this.state.unwatchedIDs[this.state.movie2.id] = 0;
    this.getMovie(2);
  }


	render() {
	  return (
        <div id="page-container">
      <div id="content-wrap">
    
        <header>
          <h1>Movies!</h1>
        </header>
        
        <hr/>
        
        <main>
          <div id="movies">
            <div class="movie-container">
              <a href="#" id="movie1" onClick={this.oneSelected}>
                <img id="poster1" class="poster" src="" />
                <p id="movieTitle1"></p>
              </a>
              <button class="skipButton" id="skip1" onClick={this.skipMovie1}>Haven't Seen / Skip</button>
            </div>
            <div class="movie-container">
              <a href="#" class="movie-container" id="movie2" onClick={this.twoSelected}>
                <img id="poster2" class="poster" src="" /> 
                <p id="movieTitle2"></p>
              </a>
              <button class="skipButton" id="skip2" onClick={this.skipMovie2}>Haven't Seen / Skip</button>
            </div>
          </div>
          <button id="new-matchup" onClick={this.newMatchup}>New Matchup</button>
          <hr/>
          
          <h2 id="ratingTitle">Top Movies</h2>
          <div id="ratings">
            
          </div>
        </main>
        
      </div>
      

      
      <footer>
          <hr/>
          <div id="bottomFooter">
            <a href="https://themoviedb.org" id="TMDBLogo">
              <img src={TMDBLogo} id="logo"/>
            </a>
            
            <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
          
            <a href="https://github.com/Flopalop2/movieratings"  id="footerLink">
              <img src={myLogo} id="logo"/>
              <div id="footerLinkText">Github</div>
            </a>
          </div>
      </footer>
    </div>
);
	}
}

export default Movies;
