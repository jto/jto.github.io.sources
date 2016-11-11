---
layout: post
title: 'Typelevel fix point'
tags: scala, typelevel, recursion
summary: Typelevel fix point
---

<header>
I've been reading and learning recently about recursion schemes. While all this is really new to me, it gave me a funny idea. I'll show the results in this post. Who knows, it may end up being useful to someone :). If you want to jump into the code, it lives [here](https://github.com/jto/hfix). See the [tests](https://github.com/jto/hfix/blob/master/src/test/scala/tests.scala) for examples.
</header>

## Disclaimer

This post assumes some familiarity with type level programming in Scala, specifically I use a bit of Shapeless, and understanding of the fixpoint type `Fix`. If you want to learn about it, the following resources have been helpful to me:

- [Pure Functional Database Programming with Fixpoint Types](https://www.youtube.com/watch?v=7xSfLPD6tiQ) by [Rob Norris](https://github.com/tpolecat) at [Scala World 2016](https://scala.world/)
- [The Y Combinator (Slight Return)](http://mvanier.livejournal.com/2897.html) by [mvanier](http://mvanier.livejournal.com/).
- [Understanding F-Algebras](https://www.schoolofhaskell.com/user/bartosz/understanding-algebras) by [Bartosz Milewski](https://www.schoolofhaskell.com/user/bartosz)
- [Datatype generic programming in Scala - Fixing on Cata](http://debasishg.blogspot.fr/2011/07/datatype-generic-programming-in-scala.html) by [Debasish Ghosh](https://twitter.com/debasishg).
- [Matryoshka's README](https://github.com/slamdata/matryoshka).

## What is this about ?

The basic idea is actually pretty simple. Given that you can abstract away recursion in a type definition using `Fix`, is it possible to create type that abstracts typelevel recursion.

Put simply, if I can use `Fix` to implement a `List`, is there something (`HFix` ?) that I can use to implement `HList` without explicitly having to deal with typelevel recursion.

**SPOILER ALERT**: The answer is YES. And it ends up being (almost) as simple as `Fix`.

## What's `Fix` again ?

Ok so just to make sure I understood the everything I've read, I started by reimplementing `Fix`. This is of course a  trivial job, as it just fit in one line:

```scala
  case class Fix[F[_]](f: F[Fix[F]])
```

That's great, but it does not tell me how to implement a `List`. So I went on and implemented a `List[A]`. Most of the article I've read fix the `A` and implement a `IntList`. Since I like  bit of challenge and wanted to be sure I understood everything, I went to the slightly harder path of implementing a trully generic `List`.

A list element is either `Cons` or `Nil`. Apart for some fiddling with the types and the absence of recursion, this should be pretty easy to understand:

```scala
trait BaseList
trait ListF[+A, +S] extends BaseList
trait Nil extends ListF[Nothing, Nothing]
object Nil extends Nil
case class Cons[A, +S](x: A, xs: S) extends ListF[A, S]
```

Now that I have the basic pieces, the only thing left to do is to actually build a `List`. Let's define a couple of constructors:

```scala
type List[A] = Fix[ListF[A, ?]]
def nil[A] = Fix[ListF[A, ?]](Nil)
def cons[A] = (x: A, xs: List[A]) => Fix[ListF[A, ?]](Cons(x, xs))
```

And now we can build a `List`:

```scala
val xs = cons(1, cons(2, cons(3, nil)))
```

And it works!


## How do I implement the same thing at the type level ?

I must admit it took me a bit of time to come up with the following piece of code. I'm quite satisfied with it thought.

It also took me some time to really get `Fix` at first. I guess it's one of those ideas that are really simple, but somehow hard to get until the "AHAH!" moment. Writing this was in the same vein. A lot of struggling, and "AHAH!" it's actually really simple (then I felt bad for having struggled so much on this...).

Here's the code (Yeah I know, I'm terrible at naming things. Any help appreciated):

```scala
trait Inductive
case class HFix[F[_], R <: Inductive](f: F[R]) extends Inductive
trait INil extends Inductive
```

So just like in the definition of `Fix`, this type is recursive. There's 2 little tricks to understand:

- Since `R` has kind `*`, we have recursion at the type level. So contrarily to `Fix`, not every element in the recursion have the same type.
- I added a `INil` type. At some point we'll need to stop the recursion. This type will have no inhabitant, and just serves that purpose.

## Creating an HList

Now how does this help me implementing `HList` ? Well, there it becomes really cool. You see, the only difference between a `List` and a `HList` is the recursion scheme. A `HList` is recursive a both the type and value level at the same time, while a `List` is only recursive at the value level. Apart from that, they are the same. Therefore, I can reuse the previously define `Nil` and `Cons`, and I just have to provide new constructors:

```scala
type HNil = HFix[ListF[Nil, ?], INil]
type ::[X, XS <: Inductive] = HFix[ListF[X, ?], XS]

val hnil: HNil = HFix[ListF[Nil, ?], INil](Nil)
def hcons[X, XS <: Inductive](x: X, xs: XS): X :: XS = HFix[ListF[X, ?], XS](Cons(x, xs))
```

I added type aliases, they're really not necessary, as `Scalac` infers types perfectly, but I think they help the reader.

I think `hnil` is particularly interesting. The empty `HList` is `Nil` and the end of type level recursion denoted by `INil`.

Now can I build HLists ?

```scala
val hs: Int :: String :: HNil = hcons(1, hcons("bar", hnil))
val xs: Int :: Int :: Int :: HNil = hcons(1, hcons(2, hcons(3, hnil)))
```

Yep, no problem at all.

## C'est le caca, c'est le cata, c'est le catamorphisme
(Sorry this joke does not translate).

So far we've defined ways of building `List` and `HList` in terms of `Fix` and `HFix` respectively.
From there it seems only natural to try to implement a catamorphism.

For `Fix` it's pretty straightforward:

```scala
def cata[A, F[_]](f: F[A] => A)(t: Fix[F])(implicit fc: Functor[F]): A =
  f(fc.map(t.f)(cata[A, F](f)))
```

Of course we need a functor for `F`. Since we're going to test this with our newly defined `List`, I'm going to define it immediately for `ListF`:

```scala
implicit def listFFunctor[T] =
  new Functor[ListF[T, ?]] {
    def map[A, B](fa: ListF[T, A])(f: A => B): ListF[T, B] =
      fa match {
        case Nil => Nil
        case Cons(x, xs) => Cons(x, f(xs))
      }
  }
```

Now let's try something simple:

```scala

val xs = cons(1, cons(2, cons(3, nil)))

val sumList =
  cata[Int, ListF[Int, ?]] {
    case Nil => 0
    case Cons(x, n) => x + n
  } _

sumList(xs) shouldBe 6
```

It works!


### Catamorphism for `HFix`

Now let's try to implement a catamorphism for `HFix`. This one is slightly more involved. I'm going to need polymorphic functions here. Luckily shapeless provide those:

```scala
trait Cata[HF, L <: Inductive] extends DepFn1[L]

trait LowPriorityCata {
  implicit def hfixCata[HF <: Poly, F[_], T <: Inductive, OutC](
    implicit
    fc: Functor[F],
    cata: Cata.Aux[HF, T, OutC],
    f: Case1[HF, F[OutC]]
  ) =
    new Cata[HF, HFix[F, T]] {
      type Out = f.Result
      def apply(t: HFix[F, T]) =
        f(fc.map(t.f)(t => cata(t)))
    }
}

object Cata extends LowPriorityCata {
  type Aux[HF <: Poly, L <: Inductive, Out0] = Cata[HF, L] { type Out = Out0 }

  def apply[HF <: Poly, L <: Inductive](implicit c: Cata[HF, L]): Aux[HF, L, c.Out] = c

  implicit def lastCata[HF <: Poly, F[_]](
    implicit
    fc: Functor[F],
    f: Case1[HF, F[INil]]
  ): Aux[HF, HFix[F, INil], f.Result] =
    new Cata[HF, HFix[F, INil]] {
      type Out = f.Result
      def apply(t: HFix[F, INil]) = f(t.f)
    }
}

def cata[HF <: Poly, L <: Inductive](l: L, f: HF)(implicit c: Cata[HF, L]) =
  c(l)
```

Interestingly, you also only need a functor for `F`. Now let's try this:

```scala

val xs = hcons(1, hcons(2, hcons(3, hnil)))

object plus extends Poly1 {
  implicit def caseNil =
    at[ListF[Nil, INil]] { _ => 0 }
  implicit def caseInt =
    at[ListF[Int, Int]] {
      case Cons(x, n) => x + n
    }
}

cata(xs, plus) shouldBe 6
```

And again in works !

## Coproducts

The last thing I wanted to try was to implement `Coproduct` in terms of `HFix`.

```scala
sealed trait Cocons[+H, +T]
final case class Inl[+H, +T](head: H) extends Cocons[H, T]
final case class Inr[+H, +T](tail: T) extends Cocons[H, T]

type :+:[H, T <: Inductive] = HFix[Cocons[H, ?], T]
```

Now the constructor for `Coproduct` is a bit more complex that `List`. We need to be able to `Inject` values into our `Coproduct`. Let's implement that. The implementation is very similar to the one in Shapeless:

```scala
trait Inject[C <: Inductive, I] {
  def apply(i: I): C
}

object Inject {
  def apply[C <: Inductive, I](implicit inject: Inject[C, I]): Inject[C, I] = inject

  implicit def tlInject[H, T <: Inductive, I](implicit tlInj: Inject[T, I]): Inject[H :+: T, I] = new Inject[H :+: T, I] {
    def apply(i: I): H :+: T = HFix(Inr(tlInj(i)))
  }

  implicit def hdInject[H, T <: Inductive]: Inject[H :+: T, H] = new Inject[H :+: T, H] {
    def apply(i: H): H :+: T = HFix(Inl(i))
  }
}

class MkCoproduct[C <: Inductive] {
  def apply[T](t: T)(implicit inj: Inject[C, T]): C = inj(t)
}

def Coproduct[C <: Inductive] = new MkCoproduct[C]
```

A simple test again:

```scala
Coproduct[Int :+: String :+: INil](1) shouldBe HFix(Inl(1))
Coproduct[Int :+: String :+: INil]("bar") shouldBe HFix(Inr(HFix(Inl("bar"))))
illTyped("Coproduct[Int :+: String :+: INil](1.2)")
```

Yep. it works :).

## Going further

All this raised a lot of other questions:

- Can this be used to actually build something useful ?
- What about corecursive types ? Do they exist ? Can we implement an typelevel anamorphism ?
- Can we define "infinite" types (like a Stream of types)? Would it make sense ? This would probably require lazyness at the type level.

I guess I'm just going to continue playing around with this for a while.
Any new idea or feedback is appreciated, either in the comments or on twitter.




