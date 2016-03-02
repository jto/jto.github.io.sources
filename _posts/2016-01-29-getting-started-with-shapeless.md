---
layout: post
title: 'Getting started with Shapeless'
tags: scala, shapeless, typelevel
summary: Getting started with shapeless
---

<header>
I've been playing with Scala for 7 years and with Shapeless for a couple of years now. This library and its community is one among the reasons that keep Scala attractive to me. [@brikis98](https://twitter.com/brikis98?lang=fr) pointed out that at little more doc wouldn't hurt. I can only agree with him. There's very little resources available to people discovering Shapeless and type level programming in Scala. Hopefully this post will help newcomers understanding the library basics.
</header>

## What's shapeless, and why should I care ?

Taken from shapeless' README:
> Shapeless is a type class and dependent type based generic programming library for Scala.

To me, Shapeless is a toolkit to leverage Scala's type system at your own profit. You may use it to have more "precise" types, like statically sized list (lists which size is known at compile time), you may also use `HList` as a better tuple.

More generally, Shapeless can be used to make the compiler work for you, scrape some boilerplate, and gain a little extra typesafety.

## Where's the doc ?

There's not much so far. The [wiki](https://github.com/milessabin/shapeless/wiki) is a good place to start, specifically [here](https://github.com/milessabin/shapeless/wiki#finding-out-more-about-the-project). The community tries to be as inclusive as possible, so you're likely to find help on the [gitter](https://gitter.im/milessabin/shapeless) channel. [Stackoverflow](http://stackoverflow.com/questions/tagged/shapeless) works very well too.

A lot of examples can be found in [shapeless' source code itself](https://github.com/milessabin/shapeless/tree/master/examples/src/main/scala/shapeless/examples). Those examples are specifically here for educational purpose, and pretty much everything in Shapeless is demonstrated.

## An incomplete guide to Shapeless features:

Here's list of shapeless' features I use the most, along with a short description and down to earth examples. There's obviously a lot more to discover, but those are basically the features I now consider essential in any non-trivial project.

### HList

`HList` are certainly the most popular feature. `HList` are `List` where the type of every element is statically known at compile time. You may see them as "tuples on steroid". The beauty of `HList` compared to tuples is that you'll find all the essential `List` methods like `take`, `head`, `tail`, `map`, `flatMap`, `zip`, etc. plus a bunch of methods specific to `HList`.

Here's a little demo:

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=0_hlist.scala"></script>

`HList` are __very__ useful. You may not realize it yet, but believe me, soon you'll see `HList` everywhere. I already wrote about [practical](/articles/type-all-the-things/) and "[less practical](/articles/typelevel_quicksort/)" use cases. Shapeless also provides a way to turn any case class into an `HList` (more on that later).

### Polymorphic functions

To explain polymorphic functions, let's start by a simple example.

Take our previously defined `HList`:

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=1_demo.scala"></script>

What happens if you want to `map` over it ?

The first element is an `Int`, the second element is a `String`, and the third is a `User`.
Your `map` function would probably look like this:

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=2_map.scala"></script>

But having to pass as much functions as there are elements in this `HList` is unpractical.
Also, defining `map` this way means you need several definitions of `map`. One for each `HList` size.

What you want is to pass to `map` a function that works on `Int` and `String`, and `User`, and let the compiler apply it on each elements of the `HList`. Something like this:

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=3_map2.scala"></script>

Clearly, `f` is a polymorphic function. Interestingly, if you can define such a function, you could define a more generic `map` that works for any `h` of type `H` where `H <: HList`.

Sadly, `&` does not exist in Scala, I made it up. The language only provides monomorphic functions. You can create a function whose domain (the type of its parameters) is `Int`, but you can't create a function whose domain is `Int` and `String` and `User`. More generally, you can't create a function whose domain type is `A` for some `A`. As a trivial exercise, try to define the `identity` function (of type `A => A`). It's impossible.

Back to our `map` function now. Of course `f` could be a function that handle the least upper bound of all the elements in this `Hlist`. In our example the type of `f` would be `Any => Any`. Generally, a function of that type is not very useful.

I already mentioned that `map` is defined for `HList`, which means Shapeless provides polymorphic functions. Here's a simple example:

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=4_poly.scala"></script>

I think the code is rather easy to understand. Notice that polymorphic functions are perfectly typesafe. Be careful not to forget the `implicit` keyword. It's a silly mistake, but I make it from times to times. Sometimes it takes a while to realize why Scalac refuses to map over a `HList` 😓

Note that polymorphic function can use implicit parameters:

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=5_poly2.scala"></script>

### Generic

`Generic` are a simple way to convert case class and product types (like tuples) to `HList`, and vice-versa:

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=6_gen.scala"></script>

Again, the code is fairly simple. `Generic` are often used to automatically derive typeclasses instances for case classes. See my other post [Type all the things](/articles/type-all-the-things/), for real world examples. `Generic` is a great way to avoid writing macros. And that's great! I don't want to maintain my poorly written macros.

### Tuples

Shapeless provide syntax for tuples, so that you can use `HList`'s methods on tuples.

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=7_tuple.scala"></script>

The code is rather obvious. Most of the `HList` methods become available on tuples by simply importing `import shapeless.syntax.std.tuple._`. Very nifty!

### Lenses

Shapeless provide a simple lenses implementation. Here's a basic example, directly taken from shapeless' examples:

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=8_lenses.scala"></script>

If you just need a lens from time to time and already have Shapeless in your project, it can be useful. For more advanced usage, consider a dedicated library like [monocle](https://github.com/julien-truffaut/Monocle).

### Abstracting over arity:

Not a specific feature per say, but based on `Hlist` and `Generic`, Shapeless provides a way to create functions of arbitrary arity.

Let's say you created a class that contains a `HList`.

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=9_myclass.scala"></script>

You may not want to force `HList` on your users. So how do you create instances of `MyClass` wihtout using `HList` directly ? Well, you can provide a bunch of `apply` methods:

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=10_applys.scala"></script>

But that's rather annoying to write. So instead you can do this:

<script src="https://gist.github.com/jto/4d7a4392a84da8446f69.js?file=11_unapplyProduct.scala"></script>

Note that you're actually passing a tuple to the `apply` method. Under stricter compiler options, you'll need an extra pair of parenthesis: `MyClass((1, "Hello", 12.6))`.

## May the source be with you, always.

If you made it this far into this blog post, you may want to learn more about shapeless.
So given the little doc currently available, you'll have to resort to reading the source code to learn more. Luckily, it's very easy to navigate in shapeless source once you've found how it's organized.

### Navigating the source

Shapeless sources are divided in 3:

- [/core/src/main/scala/shapeless](https://github.com/milessabin/shapeless/tree/master/core/src/main/scala/shapeless) contains all the base data structure definitions, each having it's own file. For example [hlist.scala](https://github.com/milessabin/shapeless/blob/master/core/src/main/scala/shapeless/hlists.scala) is the definition of `Hlist`.
- [/core/src/main/scala/shapeless/ops](https://github.com/milessabin/shapeless/tree/master/core/src/main/scala/shapeless/ops) contains all the typeclasses used by those structures. Again, each data structure having it's own file. [hlist.scala](https://github.com/milessabin/shapeless/blob/master/core/src/main/scala/shapeless/ops/hlists.scala) contains all the typeclasses for `HList`.
- [/core/src/main/scala/shapeless/syntax](https://github.com/milessabin/shapeless/tree/master/core/src/main/scala/shapeless/syntax) contains all the methods usable on each data structure. Once again each data structure having it's own file. [hlist.scala](https://github.com/milessabin/shapeless/blob/master/core/src/main/scala/shapeless/syntax/hlists.scala) contains all the methods defined on `HList`. If you want to look at the definition of `map` on `HList`, [here](https://github.com/milessabin/shapeless/blob/master/core/src/main/scala/shapeless/syntax/hlists.scala#L397) it is.

This should be enough to find pretty much everything you need to know by yourself.

### Understating the source

Luckily, everything in shapeless (apart from macros), pretty much work on the same model.
If you wish to understand how `HList` works, I've already written about it in my article [Typelevel quicksort in Scala](/articles/typelevel_quicksort/). Once you understand `HList`, everything follows. I'd really suggest to take the time to understand how `HList` are built, and how you `map` over a `HList`, even if you do not plan to use Shapeless.


## Conclusion

This article is meant to give you an overview of the basic use cases. If anything is unclear, or just not covered in this article, let me know in the comments or ping me on [twitter](https://twitter.com/skaalf). I'll try to improve it over time. If you know more resources on Shapeless or type level programming, I'd be happy to link them here.
