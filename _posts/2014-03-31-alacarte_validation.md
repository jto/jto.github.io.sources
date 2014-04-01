---
layout: post
title: '"A la carte" data validation'
tags: playframework, scala, validation, form, json, shapeless
summary: Scrap your boilerplate.
---

<header>
This article demonstrate a new application of shapeless Lenses. Using play's new validation API, we can validate Json and transform it into case classes instances. It's fully typesafe, does not rely on reflection and removes all the boilerplate code that was previously necessary.
</header>

## Json to case class with the Validation API

Let's start with a very common example. My web application is receiving a Json representation of a Contact. Of course, before transforming that Json to an instance of a class, I need to validate it. It must have a firstname, a lastname, an age, which must be an Int, etc.

<script src="https://gist.github.com/jto/9835823.js?file=1_classes.scala"></script>

Obviously the validation API provides everything I need for the Job, plus a couple of handy methods. Using scala macro, we can generate the appropriate `Rules`. Typesafety is guaranteed. Age is automatically expected to be a number. Nice and easy.

<script src="https://gist.github.com/jto/9835823.js?file=2_macros.scala"></script>

There's nothing special about those macro-generated `Rules`. You use them just like any other `Rule`. In fact, it's exactly like if you had written the code yourself. Let's see that in action:

<script src="https://gist.github.com/jto/9835823.js?file=3_demo1.scala"></script>

### Customizing the validation rules

So far, we've been very happy with our generated `Rules`. But of course, a real application is not that simple. You're not only expect the Json to have a certain structure and to match your types, you also need to make sure the values make sense. A Contact `age` must be positive, the `email` field must be a valid email, etc. Our generated `Rule` won't validate all that.

<script src="https://gist.github.com/jto/9835823.js?file=4_invalid.scala"></script>

Our generated Rules are not enough anymore. But how do we get from those generated `Rules` to "smarter" specialized Rules ?
As always, composition must be the answer! Theoretically, I **should** be able to reuse a generated `Rule`, and extend it with my custom validations. The `compose` method should help us there.

<script src="https://gist.github.com/jto/9835823.js?file=6_compose.scala"></script>

Did it work ? Kind of, but not really. We did find that the provided Json was invalid, but we can't tell exactly where the error happened. Of course we want to give valuable feedback to our users. An error without it's location is worthless.

So what do we do then ? Turns out, we **have to** rewrite everything:

<script src="https://gist.github.com/jto/9835823.js?file=5_boilerplate.scala"></script>

Even with this ceremony-less API, it's still a bit cumbersome. But there's worse, there is more code, but also potentially more errors. I could be mistyping a field name `"firstname"` could become `"fisrtname"`. Would the compiler help me there ? No, I would not catch the error until runtime. Not really satisfying. This problem has haunted me for a while, and after a bit of investigation, I found a nice and simple solution.

## Scrapping the boilerplate

It would be really nice if it was possible to, just like in Json, give a path representing a location inside a case class instance.
For example, given an instance of `Contact` use a path like `(__ \ "information" \ "email")` to get the email value.

### Shapeless to the rescue

Actually [shapeless 2](https://github.com/milessabin/shapeless) has something a bit similar. It defines `Lens` for case class. Using a `Lens`, you can traverse a type hierarchy using fields indexes. As demonstrated in [this example](https://github.com/milessabin/shapeless/blob/master/examples/src/main/scala/shapeless/examples/lenses.scala#L34-L39)


Ok, so it looks like the beginning of a solution. Now all I have to do is to implement the same thing, but this time supporting field names. A bit (actually a LOT) of head scratching latter, I finally came up with the solution, and proposed a [pull request](https://github.com/milessabin/shapeless/pull/86).

<script src="https://gist.github.com/jto/9835823.js?file=7_shapeless.scala"></script>

The beauty of this is that it's completely typesafe. The path I'm using is checked by the compiler, and the compiler would catch any error and tell me why it failed. We do not need to rely on reflection like most Java libraries do. We have the best of both world: Typesafety without the boilerplate.

From there [it's very easy](https://github.com/jto/validation/blob/shapeless/validation-core/src/main/scala/play/api/data/mapping/Formatter.scala#L188-L199) to improve the Validation API. All we have to do is to keep track of the path while using a `Lens` to traverse classes.

<script src="https://gist.github.com/jto/9835823.js?file=7_alacarte.scala"></script>

<script src="https://gist.github.com/jto/9835823.js?file=8_alacarte_json.scala"></script>

Et voila :) Typesafe, boilerplate free Json to case class transformation.