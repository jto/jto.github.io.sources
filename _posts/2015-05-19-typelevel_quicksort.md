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

## The missing parts

### Natural Numbers

First thing first, if we're going to implement a sort algorithm, we need something to sort. We'll be using natural numbers. Of course, there's no natural numbers available to use out of the box in Scala's type system. We need to create a type for each and every natural number!

Creating an infinity of types might end up being a little time confusing, so we'll do something a little smarter. We'll use MATH!

#### Peano's axioms

Peano's axioms are a simple way to formally defined what natural numbers are.

- There's one special object called 0. 0 is a natural number.
- For every natural number `n`, there's exactly one other natural number called it's successor `S(n)`.
- 0 is not the successor of any natural number. All other natural numbers are the successor of a natural number
- No two natural numbers have the same successor
- Natural numbers can be compared for equality. Equality is reflexive, symmetric and transitive.
- For some statement P, P is true for all natural number if:
	- P is true about 0
	- If P is true for a number n, (P(n) is true), P is true for n's successor (P(S(n)) is true).

You can read more about Peano's arithmetic on [Wikipedia](http://www.wikiwand.com/en/Peano_axioms).

With those axioms in mind, it's easy to represent natural numbers in Scala's type system.

Let's start by creating a Nat trait.

```scala
trait Nat
````

> There's one special object called 0. 0 is a natural number

(Since 0 is an invalid type name, we'll call it _0).

```scala
class _0 extends Nat
```

> For every natural number `n`, there's exactly one other natural number called it's successor `S(n)`.

```scala
case class Succ[P <: Nat]() extends Nat
```

Having defined those classes, we can represent any Natural number. Let's defined the natural numbers from 1 to 5.

```scala
type _1 = Succ[_0]
type _2 = Succ[_1]
type _3 = Succ[_2]
type _4 = Succ[_3]
type _5 = Succ[_4]
```
easy-peasy :)

#### Basic arithmetic

Just to prove that's that those number are actually usable, we're going to implement addition.
Again Peano tells us how to do that:

![Peano's sum](http://upload.wikimedia.org/math/9/5/d/95dd1dc28b7774e45c5be05328e4612c.png "Image from wikipedia")

It might not be obvious yet why this is enough. Luckily it translate almost directly to types.

And here's the translation in Scala, I've shamelessly stolen from [shapeless][Shapeless].
From now on, each time we'll need something that exist in [shapeless][Shapeless], we'll just take it from there. Of course I'll mention it every time.
I may remove some code for the sake of clarity if it's not relevant to us.

Meet Shapeless' `Sum`:

```scala
trait Sum[A <: Nat, B <: Nat] { type Out <: Nat }

object Sum {
  def apply[A <: Nat, B <: Nat](implicit sum: Sum[A, B]): Aux[A, B, sum.Out] = sum

  type Aux[A <: Nat, B <: Nat, C <: Nat] = Sum[A, B] { type Out = C }

  implicit def sum1[B <: Nat]: Aux[_0, B, B] = new Sum[_0, B] { type Out = B }

  implicit def sum2[A <: Nat, B <: Nat]
    (implicit sum : Sum[A, Succ[B]]): Aux[Succ[A], B, sum.Out] = new Sum[Succ[A], B] { type Out = sum.Out }
}
```

You might feel a tiny bit overwhelmed by the awesomeness.
Take a few deep breath, we'll walk that step by step:

```scala
trait Sum[A <: Nat, B <: Nat] { type Out <: Nat }
```

`Sum` take two natural number `A` and `B`, and return another natural number `Out`.
We now have a way to represent additions. `A + B = Out`.

Since we can represent, the next step is to actually compute the result of adding two natural numbers.

```scala
implicit def sum1[B <: Nat]: Aux[_0, B, B] = new Sum[_0, B] { type Out = B }
```

This this the base case of our axiomatic definition of addition.
For any natural number `b`, `0 + b = b`

We can immediately test this case using the apply method:

```scala
:t Sum[_0, Succ[_0]]
Sum.Aux[_0, Succ[_0], Succ[_0]] // 0 + 1 = 1
```

We can then define all the other cases by induction:

```scala
implicit def sum2[A <: Nat, B <: Nat]
    (implicit sum : Sum[A, Succ[B]]): Aux[Succ[A], B, sum.Out] = new Sum[Succ[A], B] { type Out = sum.Out }
```

What this says is given 2 Nat A and B,
`S(A) + B = A + S(B)`

That's not exactly the axiom defined in Wikipedia, but it's equivalent because:

- `A + S(B) = S(A + B)`
- similarly, `Succ(A) + B = S(A + B)`
- therefore `A + S(B) = S(A + B) = S(A) + B`

So if we try to evaluate the addition `3 + 1`, by mean of implicit resolution, the Scala compiler will go through the following steps:

1. `S(S(S(0))) + S(0) = S(S(0)) + S(S(0))`
1. `S(S(0)) + S(S(0)) = S(0) + S(S(S(0)))`
1. `S(0) + S(S(S(0))) = 0 + S(S(S(S(0))))`
1. And back on our base case `0 + S(S(S(S(0)))) = S(S(S(S(0))))`!
1. therefore, `S(S(S(0))) + S(0) = S(S(S(S(0))))`. `3 + 1 = 4`

We can test it in a Scala REPL:

```scala
:t Sum[Succ[Succ[Succ[_0]]], Succ[_0]]
Sum.Aux[Succ[Succ[Succ[_0]]], Succ[_0], Succ[Succ[Succ[Succ[_0]]]]]
```

We can do basic arithmetic in the type system :)

#### Inequalities

### Type level list, aka HList
#### Induction, induction, induction
#### Ordering

[shapeless]: https://github.com/milessabin/shapeless  "Shapeless"