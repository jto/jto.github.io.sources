---
layout: post
title: 'Getting started with shapeless'
tags: scala, shapeless, typelevel
summary: Getting started with shapeless
---

<header>
I've been playing around with Scala for 6 years and with Shapeless for a couple of years now. This library and its community is one of things that keeps Scala attractive to me. [@brikis98](https://twitter.com/brikis98?lang=fr) rightfully pointed out that at little more doc wouldn't hurt. I can only agree with him. There's very little resource intended to people discovering Shapeless and type level programming in Scala. Hopefully this post will help newcomers.
</header>

## What's shapeless, and why should I care ?

Taken from shapeless' README:
> Shapeless is a type class and dependent type based generic programming library for Scala.

To me, Shapeless is a toolkit to leverage Scala's type system at your own profit. You may use it to have more "precise" types, like statically sized list (lists which size is know at compile time), you may also use `HList` as a better tuple.

More generally, Shapeless can be used to make the compiler work for you, scrape some boilerplate, and gain a little extra type safety.

## Where's the doc ?

There's not much so far. The wiki is a good place to start, specifically [here](https://github.com/milessabin/shapeless/wiki#finding-out-more-about-the-project). The community tries to be as inclusive as possible, so you're likely to get help if you ask on the [gitter](https://gitter.im/milessabin/shapeless) channel.  [Stackoverflow](http://stackoverflow.com/questions/tagged/shapeless) works too.

A lot of example can be found [here](https://github.com/milessabin/shapeless/tree/master/examples/src/main/scala/shapeless/examples).

## An incomplete guide to Shapeless features:

Here's list of shapeless' features I use the most, along with a short description an examples.

### HList

`HList` are certainly the most popular feature. `HList` are `List` where the type of every element is statically known. You may see them as "tuples on steroid". The beauty of `HList` is that you'll find all the essential `List` methods like `take`, `head`, `tail`, `map`, `flatMap`, `zip`, etc. plus a bunch of methods specific to `HList`.

Here's a little demo:

```scala
import shapeless.{ ::, HList, HNil}
case class User(name: String)

val demo = 42 :: "Hello" :: User("Julien") :: HNil

// select finds the first element of type String in this HList
// Note that scalac will correctly infer the type of s to be String.
val s = demo.select[String] // returns "Hello".

demo.select[List[Int]] // Compilation error. demo does not contain an List[Int]

// Again i is correctly inferred as Int
val i = demo.head // returns 42.

val i :: s :: u :: HNil = demo
// i: Int = 42
// s: String = Hello
// u: User = User(Julien)
```

HList are _very_ useful. You may not realize it yet, but believe me, soon you'll see `HList` everywhere.

### Polymorphic functions

To explain Polymorphic functions, let's start by a simple example:

Take our previously defined `HList`:
```hlist
val demo = 42 :: "Hello" :: User("Julien") :: HNil`.
```
What happens if you want to `map` over it ?

The first element is an `Int`, the seconds element is an `String`, and the third is a `User`.
You'd need to provide a function that works on `Int`, `String`, and `User`.

Scala only provides monomorphic functions. That is you can create a function whose domain (the type of its parameters) is `Int`, but you can't create a function whose domain is `Int` or `String` or `User`.

Obviously `HList` wouldn't be as useful without polymorphic functions, so shapeless provide them:

```scala
import shapeless.Poly1

object plusOne extends Poly1 {
  implicit def caseInt = at[Int]{ _ + 1 }

  implicit def caseString = at[String]{ _ + 1 }

  implicit def caseUser = at[User]{ case User(name) =>
    User(name + 1)
  }
}

demo.map(plusOne) // returns 43 :: Hello1 :: User(Julien1) :: HNil

object incomplete extends Poly1 {
  implicit def caseInt = at[Int]{ _ + 1 }
  implicit def caseString = at[String]{ _ + 1 }
}

demo.map(incomplete) // compilation error. Our poly func does not handle User
```

### Generic

`Generic` are a simple way to convert case class and product types (like tuple) to `HList`, and vice-versa:

```scala
import shapeless.Generic

case class UserWithAge(name: String, age: Int)
val gen = Generic[UserWithAge]
val u = UserWithAge("Julien", 30)

val h = gen.to(u) // returns Julien :: 30 :: HNil
gen.from(h) // return UserWithAge("Julien", 30)
```

### Tuples
### LabelledGeneric
### Coproduct
### Lenses
### Typeclass derivation


## May the source be with you, always.

So given the little doc currently available, you'll probably have to resort to reading the source code. Luckily, it's very easy to navigate in shapeless source once you've found how it's organized.

### Navigating the source

### Finding examples

## Basic tips to know

### The `Aux`pattern

### Scalac

### Compilation errors diagnostic.

## Conclusion
