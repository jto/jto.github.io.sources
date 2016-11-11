---
layout: post
title: 'Typelevel fix point'
tags: scala, typelevel, recursion
summary: Typelevel fix point
---

<header>
I've been reading and learning recently about recursion schemes. While all this is really new to me, it gave me a funny idea. I'll show the results in this post. Who knows, it may end up being useful to someone :). If you want to directly jump into the code, it lives [here](https://github.com/jto/hfix). See the [tests](https://github.com/jto/hfix/blob/master/src/test/scala/tests.scala) for examples.
</header>

## Disclaimer

This post assumes some familiarity with type level programming in Scala, specifically I use a bit of Shapeless.
It also requires some understanding of the fixpoint type `Fix`. If you want to learn about it, the following resources have been helpful to me:

- [Pure Functional Database Programming with Fixpoint Types](https://www.youtube.com/watch?v=7xSfLPD6tiQ) by [Rob Norris](https://github.com/tpolecat) at [Scala World 2016](https://scala.world/)
- [The Y Combinator (Slight Return)](http://mvanier.livejournal.com/2897.html) by [mvanier](http://mvanier.livejournal.com/).
- [Understanding F-Algebras](https://www.schoolofhaskell.com/user/bartosz/understanding-algebras) by [Bartosz Milewski](https://www.schoolofhaskell.com/user/bartosz)
- [Datatype generic programming in Scala - Fixing on Cata](http://debasishg.blogspot.fr/2011/07/datatype-generic-programming-in-scala.html) by [Debasish Ghosh](https://twitter.com/debasishg).
- [Matryoshka's README](https://github.com/slamdata/matryoshka).

## What is this about ?

The basic idea is actually pretty simple. Given that you can abstract away recursion in a type definition using `Fix`, is it possible to create type that abstracts typelevel recursion.

Put simply, if I can use `Fix` to implement a `List`, is there something (`HFix` ?) that I can use to implement `HList` without explicitly having to deal with typelevel recursion? Even more challenging, can we do that in Scala?

**SPOILER ALERT**: The answer is **YES**. And it ends up being (_almost_) as simple as `Fix`.

## What's `Fix` again ?

Ok so just to make sure I understood the everything I've read, I started by reimplementing `Fix`. This is of course a  trivial job, as it just fit in one line:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=0_hfix.scala"></script>

That's great, but it does not tell me how to implement a `List`. So I went on and implemented a `List[A]`. Most of the articles I've read fix the `A` and implement a `IntList`. Since I like  bit of challenge and wanted to be sure I understood everything, I went to the slightly harder path of implementing a trully generic `List`.

A list element is either `Cons` or `Nil`. Apart for some fiddling with the types and the absence of recursion, this should be pretty easy to understand:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=1_listf.scala"></script>

Now that I have the basic pieces, the only thing left to do is to actually build a `List`. Let's define a couple of constructors, and a type alias to make things nicers:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=2_list.scala"></script>

And now we can build a `List`:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=3_list.scala"></script>

## How do I implement the same thing at the type level ?

I must admit it took me a bit of time to come up with the following piece of code. I'm quite satisfied with it thought.

It also took me some time to really get `Fix` at first. I guess it's one of those ideas that are really simple, but somehow hard to get until the "AHA!" moment. Writing this was in the same vein. A lot of struggling, and "AHA!" it's actually really simple (then I felt bad for having struggled so much on this...).

Here's the code (Yeah I know, I'm terrible at naming things. Any help appreciated):

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=4_hfix.scala"></script>

So just like in the definition of `Fix`, this type is recursive. There's 2 little tricks to understand:

- Since `R` has kind `*`, we have recursion at the type level. So contrarily to `Fix`, not every element in the recursion have the same type.
- I added a `INil` type. At some point we'll need to stop the recursion. This type will have no inhabitant, and just serves that purpose.

## Creating an HList

Now how does this help me implementing `HList` ? Well, there it becomes really cool. You see, the only difference between a `List` and a `HList` is the recursion scheme. A `HList` is recursive a both the type and value level at the same time, while a `List` is only recursive at the value level. Apart from that, they are the same. Therefore, I can reuse the previously defined `Nil` and `Cons`, and I just have to provide new constructors:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=5_hlist.scala"></script>

Again, I added type aliases, they're really not necessary, as `Scalac` infers types perfectly, but I think they help the reader.

I think `hnil` is particularly interesting. The empty `HList` is `Nil` and the end of type level recursion denoted by `INil`.

Now can I build HLists ?

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=6_hlist.scala"></script>

Just as easy as a normal `List`.

## C'est le caca, c'est le cata, c'est le catamorphisme!
(Sorry this joke does not translate).

So far we've defined ways of building `List` and `HList` in terms of `Fix` and `HFix` respectively.
From there it seems only natural to try to implement a catamorphism.

For `Fix` it's pretty straightforward:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=7_cata.scala"></script>

Of course we need a functor for `F`. Since we're going to test this with our newly defined `List`, I'm going to define it immediately for `ListF`:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=8_functor.scala"></script>

Now let's try something simple:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=9_list_cata.scala"></script>

It works!


### Catamorphism for `HFix`

Now let's try to implement a catamorphism for `HFix`. This one is slightly more involved. I'm going to need polymorphic functions here. Luckily shapeless provide those:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=10_hcata.scala"></script>

Interestingly, you also only need a functor for `F`. Now let's try this:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=11_hcata_test.scala"></script>

And again in works !

## Coproducts

The last thing I wanted to try was to implement `Coproduct` in terms of `HFix`.

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=12_cocons.scala"></script>

Now the constructor for `Coproduct` is a bit more complex that `List`. We need to be able to `Inject` values into our `Coproduct`. Let's implement that. It is very similar to Shapeless':

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=13_inject.scala"></script>

A simple test again:

<script src="https://gist.github.com/jto/17b1a38a9a36192c352b2d24bad948f5.js?file=14_coproduct.scala"></script>

Yep. it works :).

## Going further

All this raised a lot of other questions:

- Can this be used to actually build something useful ?
- What about corecursive types ? Do they exist ? Can we implement an anamorphism ?
- Can we define "infinite" types (like a Stream of types)? Would it make sense ? This would probably require lazyness at the type level.
- Could we implement a Y-combinator in the type system ?

I guess I'm just going to continue playing around with this for a while.
Any new idea or feedback is appreciated, either in the comments or on twitter.
