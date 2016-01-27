---
layout: post
title: 'Type all the things!'
tags: scala, anyval, shapeless
summary: Exploring the benefits of typing everything
---

<header>
In this post, I'll demonstrate how I type absolutely everything in my Scala programs. I'll demonstrate the benefits, and give techniques to scrap the some boilerplate.
</header>

## Giving explicit types to every elements of the classes

First thing first what do I mean "type absolutely everything" ? Let's take a simple example.
Say you've defined the following case class

```scala
case class User(name: String, age: Int)
```

This probably perfectly reasonable to you, and pretty similar to the code you're writing everyday.

Here's how I would write it:

```scala
case class User(name: User.Name, age: User.Age)
object User {
  case class Id(value: Long) extends AnyVal
  case class Name(value: String) extends AnyVal
  case class Age(value: Int) extends AnyVal
}
```

Okay so I just go through a little extra step and give an extra type to every fields of my case class. But why would I bother ? Not only am I adding boilerplate on the definition site, but you'd expect it to also make it harder to create new instances of User. So why bother ? Let me explain.

### Obvious benefits

To be fair, you probably see a couple obvious benefits by yourself. You may be thinking they are not worth it. That this is going to require a lot more work from you. I expect to convince you it isn't true. The benefits are huge, and the amount of extra work can be tiny. You can even make the compiler work for you.

### Extra safety

Obviously the first benefit is the extra type safety.

For example it's impossible to pass something else than a User Id to the following function:

```scala
def getUser(id: User.Id): Option[User]
```

It may not feel like much, but it is huge. Here I can only ask you to believe me. Just having a proper type for everything makes my job easier everyday, especially when refactoring. For example, you won't fear to change function parameters anymore. Nothing will break, the compiler guarantees it. This simple thing makes your program *significantly* more robust, especially as your code grow larger.

### Documentation

Let's say you stumble upon the following method:

```scala
  def all(): List[(Long, User)]
```

what is that Long ??? Well, you don't know. And if I change it to this:

```scala
  def all(): List[(User.Id, User)]
```

It's suddenly obvious. The best thing is this doc is always up to date. Moreover, types propagate inside your code, which mean everything necessarily have a basic doc.

### More precise types.

TODO

## Make the compiler work for you

### Manage resources automatically

This one is a pretty simple trick we invented with @mandubian.

When you work with Future in a real application you probably define multiple `ExecutionContext`. For example you may have an `ExecutionContext` for DB calls, and a default `ExecutionContext` for everything non blocking. Sadly, `ExecutionContext` are tricky to manage. You could easily use the default execution context for some DB calls accidentally.

Just to make things worse, screwing up with `ExecutionContext` can cause really bad bugs. It's horribly easy to end up with thread starvation in production if you just pass a wrong `ExecutionContext` _once_. When the bug happens, is hard to find the cause and therefore, it is really hard to fix...

Luckily, the solution to this problem is extremely simple. Just give its own a type to each `ExecutionContext`:

```scala
import scala.concurrent.ExecutionContext
import play.api.libs.concurrent.Akka

object Contexts {
  case class DBExeCtx(val underlying: ExecutionContext) extends AnyVal
  case class DefaultExeCtx(val underlying: ExecutionContext) extends AnyVal

  implicit def dbToEC(implicit ec: DBExeCtx) = ec.underlying
  implicit def defaultToEC(implicit ec: DefaultExeCtx) = ec.underlying

  object Implicits {
    implicit val dbCtx = DBExeCtx(Akka.system.dispatchers.lookup("contexts.db-context"))
    implicit val defaultCtx = DefaultExeCtx(play.api.libs.concurrent.Execution.defaultContext)
  }
}
```

So let's say you define a method that calls your database:

```scala
def someDbCall(implicit ctx: DBExeCtx): Future[TestResult] = // execute a SQL query
```

On call site the compiler will automatically pick up the proper `ExecutionContext`.

```scala
import fr.bollore.Contexts._, Implicits._
for {
  result <- test()
} yield result
```

### Everything is an HList !

```scala
import shapeless._
import shapeless.ops.hlist._
import models._

trait ToHlist[S] {
  type Out <: HList
  def apply(s: S): Out
}

trait LowPriorityToHlist {
  implicit def toHlist0[A, B] = new ToHlist[A ~ B] {
    type Out = A :: B :: HNil
    def apply(s: A ~ B): Out = s._1 :: s._2 :: HNil
  }
}

object ToHlist extends LowPriorityToHlist {
  type Aux[A, O] = ToHlist[A] { type Out = O }

  implicit def toHlistN[A, B, O <: HList](implicit u: ToHlist.Aux[A, O], p: Prepend[O, B :: HNil]) = new ToHlist[A ~ B] {
    type Out = p.Out
    def apply(s: A ~ B): Out = p(u(s._1), s._2 :: HNil)
  }
}

def hlist[A, B](p: A ~ B)(implicit u: ToHlist[A ~ B]) = u(p)
```

## Scrapping boilerplate

### Json reader / writers derivation

### Nicer writer customization.

## Bonus: case class to dataframes.

??? do I want to talk about this ???

## Conclusion

1. It's really impressive that implementing this beauty in a mainstream, production ready language is possible. Even if a bit of boilerplate is required.
1. We managed to implement a quicksort so slow a human could easily outperform it.

![Deal with it](http://media1.giphy.com/media/uY0lFjVSvHPeU/giphy.gif)


**Edit:** Erika Mustermann pointed out in the comment that Roman Leshchinskiy did a [type level quicksort implementation in Haskell](https://wiki.haskell.org/Type_arithmetic) a while back, based on the paper of Thomas Hallgren [Fun with Functional Dependencies](http://www.cse.chalmers.se/~hallgren/Papers/hallgren.pdf). You should have a look at it!


[Shapeless]: https://github.com/milessabin/shapeless  "Shapeless"