var currIndex = 1; // The slide it should show first
showSlides(currIndex);

// Updates the current index whenever the user
// increments the slide.
function plusSlides(n) {
  showSlides(currIndex  += n);
}

// Displays the current image and description depending
// on the user's interaction.

// n represents the current slide number
function showSlides(n) {

  // Gets all the elements associated by the class name
  var slides = document.getElementsByClassName("pic");
  var desc = document.getElementsByClassName("text");

  // If the current slide number is greater then the actual slides
  if (n > slides.length)
  {
    currIndex  = 1;
  }

  // If the current slide is less than the actual slides
  if (n < 1) {
    currIndex = slides.length;
  }

  // Hides all the images and desciptions
  for (var i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
    desc[i].style.display = "none";
  }

  // Shows the current slide and description
  slides[currIndex-1].style.display = "block";
  desc[currIndex-1].style.display = "block";
}
