# What problem does this solve?

It allows a slide show to be built in real time. While one slide is
being displayed on the public screen, another slide can be edited and
composed in private.


This project was born out of frustration at church. In our church, we
have a big flat-screen in front. I control the screen from my
laptop. I wanted to be able to show texts during the sermons, but I
didn't want the audience to see me look up the texts. I wanted to
build a slide deck in real time. While I was editing one slide, the
audience should see a different slide.

Apple's KeyNote doesn't allow realtime editing of a slide show. You
have to either edit or do the slide show, but you can't edit slides
during a slide show.

# How to run this

This project is a single page web application. It runs entirely in the
browser. But, you may need to load it from a server. You can start a
server in a terminal using python.

Check the version like this: ```python -V```.

If Python version returned above is 3.X, run

    python -m http.server

If Python version returned above is 2.X

    python -m SimpleHTTPServer

Open the page in a browser at address ```localhost:8000```.

