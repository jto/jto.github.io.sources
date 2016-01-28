---
layout: post
title: 'Type all the things!'
tags: scala, anyval, shapeless
summary: Exploring the benefits of typing everything
---

<header>
In this post, I'll demonstrate how I type absolutely everything in my Scala programs. I'll demonstrate the benefits, and give techniques to scrap some boilerplate.
</header>

## Giving explicit types to every elements of the classes

First thing first what do I mean "type absolutely everything" ? Let's take a simple example.
Say you've defined the following case class

```scala
case class UntypedUser(lastname: String, firstname: String, age: Int)
```

This looks perfectly reasonable, and pretty similar to the code every Scala developer is writing everyday.

Here's how I would write it:

```scala
case class User(lastname: User.LastName, firstname: User.FirstName, age: User.Age)
object User {
  case class Id(value: Long) extends AnyVal
  case class FirstName(value: String) extends AnyVal
  case class LastName(value: String) extends AnyVal
  case class Age(value: Int) extends AnyVal
}
```

Okay so I just go through a little extra step and give an extra type to every fields of my case class. But why would I bother ? Not only am I adding boilerplate on the definition site, but you'd expect it to also make it harder to create new instances of `User`. Let me explain.

### Obvious benefits

To be fair, you probably see a couple obvious benefits by yourself. You may be thinking they are not worth it. That this is going to require a lot more work from you. I expect to convince you it isn't true. The benefits are huge, and the amount of extra work can be tiny. You can even make the compiler work for you, and reduce your work.

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
object User {
  def all(): List[(Long, User)] = ???
}
```

what is that `Long` ? Well, you don't know. And if I change it to this:

```scala
object User {
  def all(): List[(User.Id, User)] = ???
}
```

It's suddenly becomes obvious. The best thing is this doc is always up to date! Moreover, types propagate inside your code, which mean everything necessarily have at least a basic doc.

### More precise types.

???

## Make the compiler work for you

### Manage resources automatically

This one is a pretty simple trick we invented with [@mandubian](http://mandubian.com/).

When you work with `Future` in a real application you probably define multiple `ExecutionContext`. For example you may have an `ExecutionContext` for DB calls, and a default `ExecutionContext` for everything non blocking. Sadly, `ExecutionContext` are tricky to manage. You could easily use the default execution context for some DB calls accidentally.

Just to make things worse, screwing up with `ExecutionContext` can cause really bad bugs. It's horribly easy to end up with thread starvation in production if you just pass a wrong `ExecutionContext` _once_. When the bug happens, is hard to find its cause and therefore, it is really hard to fix...

Luckily, the solution to this problem is extremely simple. Just give its own a type to each `ExecutionContext`. Here's a simplified example from one the apps I'm working on:

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

So let's say you define a method that asynchronously calls your database:

```scala
def someDbCall(implicit ctx: DBExeCtx): Future[TestResult] = // execute a SQL query
```

On call site, all you have to to is import all of your `ExecutionContext`, the compiler will automatically pick up the proper one.

```scala
import fr.bollore.Contexts._, Implicits._
for {
  result <- test()
} yield result
```

### Everything is an HList !

This one is probably my favorite trick. As you may know, [shapeless](https://github.com/milessabin/shapeless) provides automatic conversions from case classes to `HList` using `Generic`. If you're familiar with `HList`, you probably realized that you can do pretty amazing things when all the types of your `HList` are unique. In that case, you can more of less treat a `Hlist` as a sorted `Map` of values indexed by types. If you give proper types to every fields of you case class, you can very much reduce the amount of code you write.

I'll show a couple of example using [Anorm](https://www.playframework.com/documentation/2.4.x/ScalaAnorm). I like the simplicity of this library, but if you use it naively, you'll end up writing quite a lot of boilerplate.

Let's say you define a simple parser our `UntypedUser` class

```scala
  val parser =
    (
      get[String]("firstname") ~
      get[String]("lastname") ~
      get[Int]("age")
    ).map{ case firstname ~ lastname ~ age =>
      UntypedUser(firstname, lastname, age)
    }
```

As you can see, you have to write an explicit pattern match to extract all the fields of the user class.
Obviously it quickly becomes very tedious as the number of classes and fields in classes grows. Moreover, it's very easy to mix the order of fields.
Actually, I just did it on purpose here. Although the example is trivial, I'm confident you didn't catch it.

What you can do is to turn `Anorm` `~` object into an `HList` using the following functions:

```scala
import shapeless.{ ::, HList, HNil }
import shapeless.ops.hlist._
import anorm._, SqlParser._

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

  def apply[A, B](p: A ~ B)(implicit u: ToHlist[A ~ B]) = u(p)

  implicit def toHlistN[A, B, O <: HList](implicit u: ToHlist.Aux[A, O], p: Prepend[O, B :: HNil]) = new ToHlist[A ~ B] {
    type Out = p.Out
    def apply(s: A ~ B): Out = p(u(s._1), s._2 :: HNil)
  }
}
```

Here's how you use it:

```scala
  val gen = Generic[UntypedUser]
  val parser =
    (
      get[String]("firstname") ~
      get[String]("lastname") ~
      get[Int]("age")
    ).map{ u => gen.from(ToHList(u)) }
```

So we've got read of some boilerplate, but there's still a risk of mixing fields between firstname and lastname.

Now, what if we user our typed `User`:

```scala
  import User._
  import shapeless.Generic

  implicit val firstNameColumn: Column[FirstName] = ???
  implicit val lastNameColumn: Column[LastName] = ???
  implicit val ageNameColumn: Column[Age] = ???

  val gen = Generic[User]
  val parser =
    (
      get[LastName]("lastname") ~
      get[FirstName]("firstname") ~
      get[Age]("age")
    ).map{ u => gen.from(ToHlist(u)) }
```

The problem of mixed fields is now fixed, since every field has a type, we can be fairly confident we're not mixing fields anymore.
Sadly, we have introduced quite a lot of boilerplate since we have to declare a new `anorm.RowParser` for each type.

Luckily, `shapeless` get's our back again.

## Scrapping boilerplate

### Basic Anorm

There's a simple solution, just use shapeless to automatically derive instances of Columns for any class extending `AnyVal`. Here's the relevant code:

```scala
object ColumnDerivations {
  import shapeless.Generic
  import shapeless.{ ::, HList, HNil }

  implicit def hlistColumn[H](implicit c: Column[H]): Column[H :: HNil] =
    Column(c(_, _).map(_ :: HNil))

  implicit def anyvalDerivation[N <: AnyVal, H <: HList](implicit gen: Generic.Aux[N, H], c: Column[H]): Column[N] =
    Column(c(_, _).map(r => gen.from(r)))
}
```

And it's usage:

```scala
  import User._
  import shapeless.Generic
  import ColumnDerivations._

  val gen = Generic[User]
  val parser =
    (
      get[LastName]("lastname") ~
      get[FirstName]("firstname") ~
      get[Age]("age")
    ).map{ u => gen.from(ToHlist(u)) }
```

And that's it :). Any breaking change in the `User` class would cause a compilation error in this parser.

> Note that it should be possible to derive this entire parser using `LabelledGeneric`. The implementation is left as an exercise to the reader.

### Anorm join

When it comes to `JOIN` clauses, anorm is particularly tedious. You have to parse the entire row, match it, manually group data together, etc.

Here's what it typically looks like:

```scala
  val parser =
    get[Id]("id") ~
    get[LastName]("lastname") ~
    get[FirstName]("firstname") ~
    get[Age]("age") ~
    get[Song]("song")

  import scalaz.syntax.std.list._

  val users: List[UserWithFavoriteSongs] =
    SQL"""
      SELECT * FROM USER u
      LEFT JOIN SONGS s ON u.id = s.user_id
    """.as(parser *)
        .groupWhen{ (u1, u2) =>
          val id1 ~ _ ~ _ ~ _ ~ _ ~ _ = u1
          val id2 ~ _ ~ _ ~ _ ~ _ ~ _ = u2
          id1 == id2
        }.map { byUser =>
          val _ ~ lastname ~ firstname ~ age ~ _ = byUser.head
          val songs =
            byUser.map { case _ ~ _ ~ _ ~ _ ~ song =>
              song
            }.list.toList
          UserWithFavoriteSongs(lastname, firstname, age, songs)
        }
```

Ok so I think we all agree that this is horrible.
But again, strong typing and `HList` can greatly simplify things:

```scala
  val gen = Generic[UserWithFavoriteSongs]

  val parser =
    (
      get[Id]("id") ~
      get[LastName]("lastname") ~
      get[FirstName]("firstname") ~
      get[Age]("age") ~
      get[Song]("song")
    ).map(a => ToHlist(a))

  import scalaz.syntax.std.list._

  val users: List[UserWithFavoriteSongs] =
    SQL"""
      SELECT * FROM USER u
      LEFT JOIN SONGS s ON u.id = s.user_id
    """.as(parser *)
        .groupWhen(_.select[Id] == _.select[Id])
        .map { byUser =>
          val userHlist = byUser.head.tail.init
          val songs = byUser.map(_.select[Song]).list.toList
          gen.from(userHlist :+ songs)
        }
```

Which is better in every way.

### Json reader / writers derivation

### Nicer writer customization.

## Bonus: case class to dataframes.

??? do I want to talk about this ???

## Conclusion

// todo: full code.

1. It's really impressive that implementing this beauty in a mainstream, production ready language is possible. Even if a bit of boilerplate is required.
1. We managed to implement a quicksort so slow a human could easily outperform it.

![Deal with it](http://media1.giphy.com/media/uY0lFjVSvHPeU/giphy.gif)


**Edit:** Erika Mustermann pointed out in the comment that Roman Leshchinskiy did a [type level quicksort implementation in Haskell](https://wiki.haskell.org/Type_arithmetic) a while back, based on the paper of Thomas Hallgren [Fun with Functional Dependencies](http://www.cse.chalmers.se/~hallgren/Papers/hallgren.pdf). You should have a look at it!


[Shapeless]: https://github.com/milessabin/shapeless  "Shapeless"