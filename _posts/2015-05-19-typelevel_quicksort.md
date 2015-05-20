---
layout: post
title: 'Typelevel quicksort in Scala'
tags: scala, typelevel, peano, logic
summary: Implementing quicksort in Scala's typesystem
---

<header>
Most people know that Scala has a pretty advanced type system. In this post, I going to show how we can implement the quicksort algorithm using only Scala's type system.
</header>

## Quick sort -  a reminder

TODO

## Natural Numbers

First thing first, if we're going to implement a sort algorithm, we need something to sort. We'll be using natural numbers.
Of course, there's no natural numbers available to use out of the box in Scala's type system. We need to create a type for each and every natural number!
Creating an infinity of types might end up being a little time consuming, so we'll do something a little smarter. We'll use MATH!

### Peano's axioms

Peano's axioms are a simple way to formally define what natural numbers are.

- There's one special object called `0`. `0` is a natural number.
- For every natural number `n`, there's exactly one other natural number called it's successor `S(n)`.
- `0` is not the successor of any natural number. All other natural numbers are the successor of a natural number
- No two natural numbers have the same successor
- Natural numbers can be compared for equality. Equality is reflexive, symmetric and transitive.
- For some statement `P`, `P` is true for all natural number if:
	- `P` is true about `0`
	- If `P` is true for a number `n`, (`P(n)` is true), `P` is true for `n`'s successor (`P(S(n)`) is true).

You can read more about Peano's arithmetic on [Wikipedia](http://www.wikiwand.com/en/Peano_axioms).

With those axioms in mind, it's easy to represent natural numbers in Scala's type system.

Let's start by creating a Nat trait.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=0_qs.scala"></script>

> There's one special object called 0. 0 is a natural number

(Since 0 is an invalid type name, we'll call it _0).

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=1_qs.scala"></script>

> For every natural number `n`, there's exactly one other natural number called it's successor `S(n)`.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=2_qs.scala"></script>

Having defined those classes, we can represent any Natural number. Let's defined the natural numbers from 1 to 5.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=3_qs.scala"></script>

easy-peasy :)

### Basic arithmetic

Just to prove that's that those number are actually usable, we're going to implement addition.
Again Peano tells us how to do that (image taken from wikipedia):

![Peano's sum](http://upload.wikimedia.org/math/9/5/d/95dd1dc28b7774e45c5be05328e4612c.png "Image from wikipedia")

It might not be obvious yet why this is enough. Luckily it translate almost directly to types.

And here's a translation in Scala that I've shamelessly stolen from [Shapeless][Shapeless].
From now on, each time we'll need something that exist in [Shapeless][Shapeless], we'll just take it from there. Of course I'll mention it every time.
I may remove some code for the sake of clarity if it's not relevant to us.

Meet Shapeless' `Sum`:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=4_qs.scala"></script>

You might feel a tiny bit overwhelmed by the awesomeness.
Take a few deep breath, we'll walk that step by step:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=5_qs.scala"></script>

`Sum` take two natural number `A` and `B`, and return another natural number `Out`. It's using [dependent type](https://www.wikiwand.com/en/Dependent_type) to create a type level function. The type `Out` depends of `A` and `B`. In other word, we'll give Scalac an `A` and a `B`, and it will magically give us `Out`.

We now have a way to represent additions. `A + B = Out`!

Since we can represent, the next step is to actually compute the result of adding two natural numbers.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=6_qs.scala"></script>

This this the base case of our definition of addition.
For any natural number `b`, `0 + b = b`

We can immediately test this case using the apply method:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=7_qs.scala"></script>

We can then define all the other cases by induction:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=8_qs.scala"></script>

What this says is given 2 Nat `A` and `B`,
`S(A) + B = A + S(B)`

That's not exactly the axiom defined in Wikipedia, but it's equivalent because:

- `A + S(B) = S(A + B)`
- similarly, `Succ(A) + B = S(A + B)`
- therefore `A + S(B) = S(A + B) = S(A) + B`

So if we try to evaluate the addition `3 + 1`, by mean of implicit resolution, the Scala compiler will go through the following steps:

1. `S(S(S(0))) + S(0) ⇔ S(S(0)) + S(S(0))`
1. `S(S(0)) + S(S(0)) ⇔ S(0) + S(S(S(0)))`
1. `S(0) + S(S(S(0))) ⇔ 0 + S(S(S(S(0))))`
1. And back on our base case `0 + S(S(S(S(0)))) ⇔ S(S(S(S(0))))`
1. therefore, `S(S(S(0))) + S(0) ⇔ S(S(S(S(0))))`.

We can test it in a Scala REPL:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=9_qs.scala"></script>

We can do basic arithmetic in the type system :)

### Inequalities

To implement quicksort, we need to be able to compare natural numbers. Again, [Shapeless][Shapeless] got us covered:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=10_qs.scala"></script>

Again we just have to cover a base case `0`, and use induction to cover all other cases.

Zero is the smallest natural number so `∀x∈N. 0 < S(x)`

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=11_qs.scala"></script>

We can immediately test:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=12_qs.scala"></script>

Since a value of type `LT[_0, _1]` exists, `0 < 1`. (see [Curry–Howard correspondence](http://www.wikiwand.com/en/Curry%E2%80%93Howard_correspondence))

For every other cases, we just compare the numbers predecessors:
`∀ x,y ∈ N. S(x) < S(y) ⇔ x < y`.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=13_qs.scala"></script>

Again the compiler will walk its way to the base case:

1. `S(S(0)) < S(S(S(0))) ⇔ S(0) < S(S(0))`
1. `S(0) < S(S(0)) ⇔ 0 < S(0)`
1. We're back on our base case

Let's test it:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=14_qs.scala"></script>

No instance of `LT[_2, _1]` exists, which mean we can't prove that `2 < 1`.

To implement quicksort, we'll also use `≥`. Shapeless does not provide it, but it does provide `≤`, We'll just use that instead.
I think you'll be able to figure out how the following code works by yourself.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=15_qs.scala"></script>

## Type level list, aka HList

Alright, we know have a way to work with natural numbers, but if we're going to sort them, we also need to have a list.
Here's is a simplified version of [Scala's list](https://github.com/scala/scala/blob/v2.11.5/src/library/scala/collection/immutable/List.scala#).

```scala
sealed abstract class List[+A]
case object Nil extends List[Nothing]
final case class ::[B](head: B, tail: List[B]) extends List[B]
```

So a list is recursively defined. It can be 2 things:
- An empty list
- A first element (head), and another list (tail) of the same type.

A HList is defined in exactly the same way, except the recursion happens in the type system.
Once again, HList are already defined in shapeless:

```scala
sealed trait HList
final class ::[+H, +T <: HList] extends HList
final class HNil extends HList
```

Just like a classical list, a Hlist is either empty, or a head and a tail.
Note how similar those two definitions are! Traditionally, HList also store values. Since we're only working in the type system, and for the sake of clarity, I removed the useless code.

Let's create a list of natural number!

```scala
type NS = _1 :: _0 :: _3 :: _2 :: HNil
```

### Induction, induction, induction
### Ordering

<script src="https://gist.github.com/jto/2dc882c455b79378289f.js"></script>

[Shapeless]: https://github.com/milessabin/shapeless  "Shapeless"