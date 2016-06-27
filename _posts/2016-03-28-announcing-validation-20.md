---
layout: post
title: 'Announcing jto/validation 2.0'
tags: scala, cats, scala.js, validation
summary: Announcing Validation 2.0
---

<header>
The new version of my [validation library](https://github.com/jto/validation) is out After a few years in production, it was time for it to undergo a massive update.
</header>

## What's jto/validation again ?

jto/validation is a library originally born to replace play-json validation features. It aimed to generalize the library to support other data formats. jto/validation never made it to Play because it was thought to be to big a leap (at least for Play 2.x).

Today, the library supports JSON (both play-json, json4s, and "native"), play forms, XML and CSV. It is also easily extensible to any data format.

## Why 2.0 ?

After using v1.x for years, we had a pretty clear idea on how to improve it. Here's are the most important evolutions:

- We got rid of [play-functional](https://github.com/playframework/playframework/tree/master/framework/src/play-functional/src/main/scala/play/api/libs/functional), and replaced it with [cats](https://github.com/typelevel/cats). Cats is well written, well maintained, well documented, complete and sound, and is a great fit for us.
- Since jto/validation is decoupled from Play, it now supports Scala.js. You can now write Rules and Writes, and share them between the server and the browser.
- The library now has a proper package name, and does not steal Play's anymore.
- jto/validation 2.0 supports Play 2.5.x (playjson only)

### Other improvements

- Tests are now automatically run on [travis-ci.org](https://travis-ci.org/jto/validation).
- Code coverage is now measured, and published automatically on [coveralls.io](https://coveralls.io/github/jto/validation). We'll give the library an even better test coverage in the future releases.


## How do I use It ?

The project's [README](https://github.com/jto/validation/blob/master/README.md) should provide everything needed to start

## Where's the doc ?

Version 2.0 comes with an [all new and shiny gitbook](http://jto.github.io/validation/docs/book/), featuring a live example in the [Scala.js section](http://jto.github.io/validation/docs/book/ScalaJsValidation.html). That's right, you can try the library directly in your browser!

## Is it backward compatible with 1.x ?

Almost ;) You'll have to do a (tiny) bit of work to migrate from 1.x to 2.0. Fear not, the migration has been tested, and the required steps documented [here](http://jto.github.io/validation/docs/book/V2MigrationGuide.html). Migrating should take a few minutes at most. The compiler will also guide you through the migration with deprecation warnings giving indications on how to migrate

## Contributing

Feedbacks (positive and negative), bug reports and pull requests have always been more than welcome. Come talk with is on [github](https://github.com/jto/validation), or in [the gitter channel](https://gitter.im/jto/validation).

## Credits

The library now has a second maintainer: [Olivier Blanvillain](https://github.com/OlivierBlanvillain).
Credits for this new version should go to him. He, amongst other things, added Scala.js support, created the git book and replaced play-functional by [cats](https://github.com/typelevel/cats).
