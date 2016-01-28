---
layout: post
title: 'Type all the things!'
tags: scala, shapeless
summary: Exploring the benefits of typing everything
---

<header>
In this post, I'll demonstrate how I type absolutely everything in my Scala programs. I'll demonstrate the benefits, and give techniques to scrap some boilerplate.
</header>

## Giving explicit types to every elements of the classes

First thing first what do I mean "type absolutely everything" ? Let's take a simple example.
Say you've defined the following case class

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=UntypedUser.scala"></script>

This looks perfectly reasonable, and pretty similar to the code every Scala developer is writing everyday.

Here's how I would write it:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=User.scala"></script>

Okay so I just go through a little extra step and give an type to every fields of my case class. But why would I bother ? Not only am I adding boilerplate on the definition site, but you'd expect it to also make it harder to create new instances of `User`. Let me explain.

### Obvious benefits

To be fair, you probably see a couple of obvious benefits by yourself. You may be thinking they are not worth it. That this is going to require a lot more work from you. I intend to convince you otherwise. The benefits are huge, and the amount of extra work can be tiny. You can even make the compiler work for you, and reduce your work.

### Extra safety

Obviously the first benefit is the extra type safety.

For example it's impossible to pass something else than an `User.Id` to the following function:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=getUser.scala"></script>

It may not feel like much, but it is huge. Here I can only ask you to believe me. Just having a proper type for everything makes my job easier everyday, especially when refactoring. For example, you won't fear to change function parameters anymore. Nothing will break, the compiler guarantees it. This simple thing makes your program *significantly* more robust, especially as your codebase grows larger.

### Documentation

Let's say you stumble upon the following method:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=UserAll.scala"></script>

what is that `Long` ? Well, you don't know.

What if I change it to this ?

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=UserAllTyped.scala"></script>

It's suddenly becomes obvious. The best thing is this doc is always up to date! Moreover, types propagate inside your code, which mean everything necessarily have at least a basic doc.

## Make the compiler work for you

### Manage resources automatically

This one is a pretty simple trick we came to with [@mandubian](http://mandubian.com/).

When you work with `Future` in a real application you probably define multiple `ExecutionContext`. For example you may have an `ExecutionContext` for DB calls, and a default `ExecutionContext` for everything non blocking. Sadly, `ExecutionContext` are tricky to manage. You could easily use the default execution context for some DB calls accidentally.

Just to make things worse, screwing up with `ExecutionContext` can cause really bad bugs. It's horribly easy to randomly observe thread starvation in production, just by passing a wrong `ExecutionContext` _once_. Your application suddenly stops doing anything for a few seconds, users are not happy. When the bug happens, is hard to find its cause and therefore, it is really hard to fix...

Luckily, the solution to this problem is extremely simple. Just give its own a type to each `ExecutionContext`. Here's a simplified example from an Play app I'm working on:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=Contexts.scala"></script>

So let's say you define a method that asynchronously calls your database:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=dbCall.scala"></script>

On call site, all you have to to is import all of your `ExecutionContext`, the compiler will automatically pick up the proper one.

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=testCall.scala"></script>

### Everything is an HList !

This one is probably my favorite trick. As you may know, [shapeless](https://github.com/milessabin/shapeless) provides automatic conversions from case classes to `HList` using `Generic`. If you're familiar with `HList`, you probably realized that you can do pretty amazing things when all the types of your `HList` are unique. In that case, you can more of less treat a `Hlist` as a sorted `Map` of values indexed by types. If you give proper types to every fields of you case class, you can very much reduce the amount of code you write.

I'll show a couple of example using [Anorm](https://www.playframework.com/documentation/2.4.x/ScalaAnorm). I like the simplicity of this library, but if you use it naively, you'll end up writing quite a lot of boilerplate.

Let's say you define a simple parser our `UntypedUser` class

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=DBParser.scala"></script>

As you can see, you have to write an explicit pattern match to extract all the fields of the user class.
Obviously it quickly becomes very tedious as the number of classes and fields in classes grows. Moreover, it's very easy to mix the order of fields.

Just for the sake of proving my point, I just did it here. Although the example is trivial, I'm confident you didn't catch the bug.

What you can do is to turn `Anorm`'s' `~` object into an `HList` using the following functions:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=ToHlist.scala"></script>

Here's how you use it, in conjunction with `Generic`:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=ToHListDemo.scala"></script>

So we've got rid of some boilerplate, but there's still a risk of mixing fields between firstname and lastname.

Now, what if we use our typed `User`:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=TypedUserToHList.scala"></script>

The problem of mixed fields is now fixed, since every field has a type. We can be fairly confident we're not mixing fields anymore.
Sadly, we have introduced quite a lot of boilerplate since we have to declare a new `anorm.RowParser` for each type.

Luckily, `shapeless` saves us again.

## Scrapping boilerplate

### Basic Anorm

There's a simple solution, just use shapeless to automatically derive instances of `Column` for any class extending `AnyVal`. Here's the relevant code:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=ColumnDerivations.scala"></script>

And its usage:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=ColumnDerivationsUse.scala"></script>

And that's it :). Any breaking change in the `User` class would cause a compilation error in this parser.

> Note that it should be possible to derive this entire parser using `LabelledGeneric`. The implementation is left as an exercise to the reader.

### Anorm join

When it comes to `JOIN` clauses, anorm is particularly tedious. You have to parse the entire row, match it, manually group data together, etc.

Let's say we've defined a new class:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=UserWithSongs.scala"></script>

Here's what getting rows from a DB would typically look like:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=join0.scala"></script>

I think we agree that this is horrible. If you don't type everything, it's also very much error prone.

But again, strong typing and `HList` can greatly simplify things:

<script src="https://gist.github.com/jto/e0b8233ad1eded3a26e9.js?file=join.scala"></script>

Which is better in every way. Mostly, it's easier because we can select fields by type, using the `HList` as a type indexed map. This only works because each field has it's own type.
Making a mistake while grouping is very unlikely. This code is shorter, simpler and safer.

Another benefit is that you can have customized parsers for some types. For example you may have special logic for extracting `Age`, that is different than every other `Int` based `AnyVal`. In this case, you could simply explicitly define a `Column[Age]`, and derive the other classes.

## Conclusion

Hopefully I have convinced you that typing everything is the way to go. If you're not convinced yet, I can only encourage you to try it on a real application. I've applied this philosophy for the last 2 years in every projects, I'll never go back. The benefits are just there, the cost minimal. It's a no brainer.