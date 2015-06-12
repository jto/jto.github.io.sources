---
layout: post
title: 'Typelevel quicksort in Scala'
tags: scala, logic, shapeless, type dependent
summary: Implementing quicksort in Scala's typesystem
---

<header>
Most people know that Scala has a pretty advanced type system. In this post, I'm going to show how we can implement the [quicksort](http://www.wikiwand.com/en/Quicksort) algorithm using only Scala's type system. The full code of this little demo can be found [here](https://gist.github.com/jto/2dc882c455b79378289f).
</header>

## Natural Numbers

First thing first, if we're going to implement a sort algorithm, we need something to sort. We'll be using natural numbers.
Of course, there's no natural numbers available out of the box in Scala's type system. We need to create a type for each and every natural number!

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
	- If `P` is true for a number `n`, (`P(n)` is true), `P` is true for `n`'s successor (`P(S(n))` is true).

You can read more about Peano's arithmetic on [Wikipedia](http://www.wikiwand.com/en/Peano_axioms).

With those axioms in mind, it's easy to represent natural numbers in Scala's type system.

Let's start by creating a Nat trait.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=0_qs.scala"></script>

> There's one special object called `0`. `0` is a natural number (Since `0` is an invalid type name, we'll call it `_0`).

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=1_qs.scala"></script>

> For every natural number `n`, there's exactly one other natural number called it's successor `S(n)`.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=2_qs.scala"></script>

Having defined those classes, we can represent any natural number. Let's defined the natural numbers from 1 to 5.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=3_qs.scala"></script>

easy-peasy :)

### Basic arithmetic

Just to prove that those numbers are actually usable, we're going to implement addition.
Again Peano tells us how to do that (image taken from wikipedia):

![Peano's sum](http://upload.wikimedia.org/math/9/5/d/95dd1dc28b7774e45c5be05328e4612c.png "Image from wikipedia")

It might not be obvious yet why this is enough. Luckily it translate almost directly to types.

And here's a translation in Scala that I've shamelessly stolen from [Shapeless][Shapeless].
From now on, each time we'll need something that exist in [Shapeless][Shapeless], we'll just take it from there, because, you know, "Great Artists Steal" (plus, I'm lazy). Of course I'll mention it every time.
I may remove some code for the sake of clarity if it's not relevant to us.

Meet Shapeless' `Sum`:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=4_qs.scala"></script>

You might feel a tiny bit overwhelmed by the awesomeness.
Take a few deep breathes, we'll walk that step by step:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=5_qs.scala"></script>

`Sum` takes two natural numbers `A` and `B`, and returns another natural number `Out`. It's using [dependent types](https://www.wikiwand.com/en/Dependent_type) to create a type level function. The type `Out` depends on `A` and `B`. In other words, we'll give Scalac an `A` and a `B`, and it will magically figure out what `Out` is.

We now have a way to represent additions. `A + B = Out`!

Since we can represent, the next step is to actually compute the result of adding two natural numbers.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=6_qs.scala"></script>

This this the base case of our definition of addition.
For any natural number `b`, `0 + b = b`.

We can immediately test this case using the apply method:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=7_qs.scala"></script>

The other cases are defined by induction:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=8_qs.scala"></script>

What this says is given 2 Nat `A` and `B`,
`S(A) + B = A + S(B)`

That's not exactly the axiom defined in Wikipedia, but it's equivalent because:

- `A + S(B) = S(A + B)`
- similarly, `S(A) + B = S(A + B)`
- therefore `A + S(B) = S(A + B) = S(A) + B`

So if we try to evaluate the addition `3 + 1`, by mean of implicit resolution, the Scala compiler will go through the following steps:

1. `S(S(S(0))) + S(0) = S(S(0)) + S(S(0))`
1. `S(S(0)) + S(S(0)) = S(0) + S(S(S(0)))`
1. `S(0) + S(S(S(0))) = 0 + S(S(S(S(0))))`
1. And back on our base case `0 + S(S(S(S(0)))) = S(S(S(S(0))))`
1. therefore, `S(S(S(0))) + S(0) = S(S(S(S(0))))`.

We can test it in a Scala REPL:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=9_qs.scala"></script>

We can do basic arithmetic in the type system :)

### Inequalities

To implement quicksort, we need to be able to compare natural numbers. Again, [Shapeless][Shapeless] got us covered:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=10_qs.scala"></script>

As always, we just have to cover a base case `0`, and use induction to cover all other cases.
Zero is the smallest natural number so `∀x∈N. 0 < S(x)`

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=11_qs.scala"></script>

We can immediately test that:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=12_qs.scala"></script>

As you already know, type are propositions, and programs are proofs. Since a value of type `LT[_0, _1]` exists, the compiler just proved that `0 < 1`. (see [Curry–Howard correspondence](http://www.wikiwand.com/en/Curry%E2%80%93Howard_correspondence))

For every other cases, we just compare the numbers predecessors:
`∀ x,y ∈ N. S(x) < S(y) ⇔ x < y`.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=13_qs.scala"></script>

Again the compiler will walk its way to the base case:

1. `S(S(0)) < S(S(S(0))) ⇔ S(0) < S(S(0))`
1. `S(0) < S(S(0)) ⇔ 0 < S(0)`
1. We're back on our base case

Let's test it:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=14_qs.scala"></script>

- An instance of `LT[_1, _2]` exists, which mean we can prove that `1 < 2`.
- No instance of `LT[_2, _1]` exists, which mean we can't prove that `2 < 1`.

To implement quicksort, we'll also use `≥`. Shapeless does not provide it, but it does provide `≤`, We'll just use that instead.
I think you'll be able to figure out how the following code works by yourself.

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=15_qs.scala"></script>

## Type level list, aka HList

Alright, we now have a way to work with natural numbers, but if we're going to sort them, we also need to have a list.
But how do lists work ? Here's is a simplified version of [Scala's list](https://github.com/scala/scala/blob/v2.11.5/src/library/scala/collection/immutable/List.scala#).

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=16_qs.scala"></script>

So a list is recursively defined, and can be 2 things:

- An empty list
- A first element (`head`), and another list (`tail`) of the same type.

To represent a list of types, we'll use `HList`. A `HList` is defined in exactly the same way, except the recursion happens in the type system.
Once again, `HList` are already defined in shapeless:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=17_qs.scala"></script>

Just like a classical list, a `HList` is either empty, or a `head` and a `tail`.
Note how similar the two definitions are! Traditionally, `HList` also stores values. Since we're only working in the type system, and for the sake of clarity, I removed the useless code.

Let's create a type level list of natural numbers:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=18_qs.scala"></script>

### Partitioning

We have almost everything we need. We now need the ability to partition our `HList` into 3 elements:

- the pivot
- a `HList` of types smaller or equal to the pivot
- a `HList` of types larger than the pivot

This time, Shapeless does not provide anything built-in. For once, we are on our own :)

Let's start by finding the smaller elements. Given a list `H`, and a natural number `A`, we want to get a new `Hlist`:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=19_qs.scala"></script>

We can now start to implement the resolution, starting by the usual base case; the empty list:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=20_qs.scala"></script>

Now we must ask ourself, "what are the other cases" ?
When defining a function working with list, we usually pattern match on the first element (the `head`), and recursively call ourself on the `tail`.

We'll do just that. Two cases are then possible. Either the first element is smaller or equal to the pivot, in that case we keep it:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=21_qs.scala"></script>

Or it's not, and we ignore it:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=22_qs.scala"></script>

Testing the code:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=23_qs.scala"></script>

The sublist of types greater than the pivot can be obtained in a similar manner:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=24_qs.scala"></script>

And again, testing it:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=25_qs.scala"></script>

### HList concatenation

Almost there! The quicksort algorithm requires some list concatenation. We need to implement a way to prepend an `Hlist` to another `Hlist`.
By now you have enough understanding to figure this out by yourself:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=26_qs.scala"></script>

Testing it:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=27_qs.scala"></script>

### Sorting

Finally! We have everything we need to implement our quicksort. All we have to do now is to put the pieces together.

A sort algorithm takes an list, and returns a list:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=28_qs.scala"></script>

 As usual, we'll first deal with a base case. Sorting an empty list results in an empty list:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=29_qs.scala"></script>

Now the inductive case:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=30_qs.scala"></script>

WOW. Quite a lot of types this time. Luckily, it's nothing really hard.

1. First, we want to extract the pivot. Since I like simplicity, we'll just extract the head of the list `H`, and the tail `T`: `new Sorted[H :: T] { ... }`
1. Then, we want to split the tail `T` in two sublists. All we have to do is ask the compiler to figure this out (using implicit parameters):
    - `LTEqs.Aux[T, H, lsOut]` -> give me all the types in `T` smaller or equal to `H`, and call that sublist `lsOut`.
    - `GTs.Aux[T, H, gsOut],` -> give me all the types in `T` greater than `H`, and call that sublist `gsOut`.
1. Sort the sublists:
    - `Sorted.Aux[lsOut, smOut]` -> Sort `lsOut`, the resulting `HList` is called `smOut`
    - `Sorted.Aux[gsOut, slOut]` -> Sort `gsOut`, the resulting `HList` is called `slOut`
1. Concatenate the sorted list of smaller types, the pivot, and the sorted list of larger types:
    - `Prepend[smOut, H :: slOut]`

And we're done. The result is `preps.Out`.

Let's run the final test:

<script src="https://gist.github.com/jto/a9b288d5f613a1031789.js?file=31_qs.scala"></script>

## Conclusion

1. It's really impressive that implementing this beauty in a mainstream, production ready language is possible. Even if a bit of boilerplate is required.
1. We managed to implement a quicksort so slow a human could easily outperform it.

![Deal with it](http://media1.giphy.com/media/uY0lFjVSvHPeU/giphy.gif)


**Edit:** Erika Mustermann pointed out in the comment that Roman Leshchinskiy did a [type level quicksort implementation in Haskell](https://wiki.haskell.org/Type_arithmetic) a while back, based on the paper of Thomas Hallgren [Fun with Functional Dependencies](http://www.cse.chalmers.se/~hallgren/Papers/hallgren.pdf). You should have a look at it!


[Shapeless]: https://github.com/milessabin/shapeless  "Shapeless"