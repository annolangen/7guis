# 7guis

Trying my own hand at the challenge posed at
https://eugenkiss.github.io/7guis. Instead of a UI framework, I'm using a
select set of tools and a functional programming style.

- typescript: Just enough type checking to have a good IDE experience and
  automatic documentation
- parcel: makes typescript integration look easy
- lit-html: non-framework to render DOM effeciently enough to support a
  functional programming style for rendering

My typescript coding style prefers functions over classes. I use classes
where implementation inheritance makes sense, but I prefer to use closures
to encapsulate state. Lit-html's superpower is caching the DOM tree and
only updating the parts that change. This makes it possible to conceptualy
re-render the DOM for every UI event. The main app literally does this for
event types: Change, Click, HashChange (for routing), and Input.

I am using the URL anchor for routing. This is a simple way to support history.

## Installation

Install the Node Package Manager (npm) and run the following commands:

```bash
npm install
npm run start
```
