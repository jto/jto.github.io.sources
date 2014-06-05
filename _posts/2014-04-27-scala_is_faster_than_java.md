---
layout: post
title: 'Scala is faster than Java'
tags: scala, java, benchmark
summary: Benchmarking Scala and Java.
---

<header>
Scala is generally considered slower than Java, especially when it's used in a functional style. This article explains why this generally accepted assumption is just wrong.
</header>

## Data validation

One of the very common problem in programming is data validation. In a word, we want to make sure that every incoming data has the correct structure. We need to discriminate unsafe external inputs from safe, compiler validated data. In a typical web application, you need do that on every request. Surely, it could have an impact on the performances of your application. In this article, I'm going to compare two extremely different solutions addressing the issue. The Bean validation API from Java, which is the standard Java solution, and the unified validation API from play. It's a functional approach, featuring immutability and typesafety.

### Java: The Bean Validation API, aka JSR 303

The bean validation [specification](https://jcp.org/en/jsr/detail?id=303) was first released in 2009. This API uses annotations to set constraints on *Java Beans <sup>©</sup>*. You then call the validation method on an annotated instance to find out if its valid. The reference, and most popular implementation is from [Hibernate](http://hibernate.org/validator/).

Here's a little example from their website:

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=1_example.java"></script>

That's for the declaration. The actual validation looks like this (again, from their website):

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=2_example2.java"></script>

So you pass an instance to `validator.validate` and you get a `Set` of errors. If the Set is empty, the object was valid.

#### Parsing JSON

### Scala: Play new unified validation API.

The unified validation API is an effort to provide the core primitives needed to validate any data structure. Its primary intent is to replace the Json validation API and the form validation API in play framework.

Here is a port of the example from Hibernate's website.

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=3_example.scala"></script>

Apart form the validation rule being defined outside of the class, it looks pretty similar. It is worth noting that this code is typesafe. A error of field name (say: `(__ \ 'setaCount).read(min(2))`) would cause a compilation error.

When implementing the API, I didn't focus much on performances. My primary objectives were correctness, compositionality, and typesafety. Actually some design choices, like making every validator lazily evaluated, have a negative impact on performances.

## Benchmark

### The test protocol

The benchmark consist of parsing and validating Json objects stored in a file. The data are extracted from [the Last.fm Dataset](http://labrosa.ee.columbia.edu/millionsong/lastfm). The JSON structure has been changed a bit for easier parsing (using the awesome [jq](http://stedolan.github.io/jq/)).

The performances are measured using a series of scalameter micro-benchmarks.

### Results

Scala is faster

<canvas id="chart" width="500" height="400"></canvas>

## Benchmarks are unimportant

So what do we learn today ?

We learn that in this particular setup, a particular library written in Scala is faster than a particular library written in Java.
It certainly does not mean that a Java program is always going to be slower than the same program written in Scala.

Since the beginning of Scala, we've seen *a lot* of people wondering [if Scala is slower than Java](https://www.google.fr/search?q=scala+is+too+slow&oq=scala+is+slo&aqs=chrome.2.69i57j0l5.3709j0j7&sourceid=chrome&es_sm=91&ie=UTF-8#q=java%20vs%20scala%20benchmark).

Benchmarks are getting a lot of attention. [This one](http://www.techempower.com/benchmarks/) in particular demonstrate that a web app sending json responses written using `cpoll_cppsp` is 4 times faster than in `nodejs`, which "only" sends 228,887 responses per-second.

I write web applications for a living. I even contribute code to a web framework. Is that relevant to me ?

*Obviously not*. A benchmark is never going to come close to what a real production application does. 228,887 responses per-seconds on a single node is, by an order of magnitude, more than any real application figures.

So what is the value of my benchmark you may ask. Not much. I just proved that, contrary to popular beliefs, a Scala program can be faster than its Java counterpart.

The interesting question is: Why is it faster while relying on a "slow" language. The answer is actually quite simple. A better, more scalable language provides better tools to write better programs.

It does not matter that Java kills Scala on micro-benchmarks. Because Java lacks essential constructs, we rely on workarounds like using reflection.
Those workarounds not only hurt the performance of your application, but more importantly, they're making you're program harder to reason about.

When it comes to choosing a piece of software, like a web framework **TODO**

## A case for correctness compositionality, and user-friendliness.

### Java's problems

#### Hard to use API

The main problem I have with the Java validation API, (actually with Java in general) is it's unnecessary complexity.
Sure for trivial use-cases it looks nice and simple, but as soon as you start to use it, things get funny:

Let's see a simple example, what if we use JSR-303 on an instance of Track:

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=4_correctness.java"></script>

Surely, it will check that our track instance is valid. __WRONG__. You see we didn't state explicitly that when verifying the validity of a track, we must also check the validity of its tags and similars. You need to add a `@Valid` on each of the attribute.

That behavior is extremely counter-intuitive. I fail to see how a `Track` instance can be valid if its members aren't.

#### Invalid Instances

JSR 303 does not handle data marshalling and unmarshalling. It's only about validation. For the purpose of this test, I used Jackson to unmarshall the Json into class instances. Personally, I think that validation is part of unmarshalling. One can't simply transform a JSON tree in a class instance without checking the Json structure beforehand. Does the "age" field I'm expecting exists ? Is it an integer ? Considering that point, the Java API seems very odd.

Json -> Validating Json (Json) -> Parsing Json (Jackson) -> class Instance -> Validating Instance (JSR-303)

One of the things worth noting is that the API is not only creating, but also exposes you directly with "invalid" instances.

#### Hard to extend API

Hibernate Validator comes with a handful of built-in validation rules (Email, Length, NotBlank, etc...).

What if you need create a new validation constraint (example from hibernate's doc)?

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=5_extend.java"></script>

That's approximately 25 lines of code. 21 of which are pure [ceremony](TODO: link to rich hickey talk)

The only interesting part is:

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=6_extend_simple.java"></script>

How do we implement the same thing using the unified validation API ?

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=7_extend.scala"></script>

Yep, that's 6 lines of codes. I'm confident anybody can graps it.

Now, what if I have a `min` rule, a `max` rule, and I want to create a `between` rule ?

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=8_compose.scala"></script>

And in java ? Well, I don't even feel like writing that code. It would just be long and tedious.

#### Exceptions

 /// ???

We've seen in this benchmark that the java program is significantly slower when there's a lot of error. On the other end, validation errors have little impact on the scala side.

Why is that. Is it the extra object instantiations ? Clearly not. Both program have to do that. So what is it then ?
Well, the JSR gives the answer:

## Scala bonus: Easy parallelism

## "Java 8 will save us all with its lambdas!"

No.

## Conclusion

I think the point of this post is rather obvious. When it comes to choosing a library or a language, benchmarks are rather unhelpful. A properly implemented algorithm can always be optimised. A broken implementation is just broken.

This particular example proves that even though Scala has some overhead, its superior design makes it possible to create libraries that are not only simpler, but also more performant than their Java counterparts.
<script src="//code.jquery.com/jquery-1.9.1.min.js" type="text/javascript" charset="utf-8"></script>
<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/Chart.js/0.2.0/Chart.min.js"></script>
<script src="/assets/js/jquery.parse.min.js" type="text/javascript" charset="utf-8"></script>
<style>
	#chart {
		display: block;
		height: 400px;
		width: 500px;
		margin: 0 auto;
	}
</style>
<script type="text/javascript">
	var prefix = "/assets/scala_is_faster_than_java/",
		files = [
			"Java.JSR-303-invalids.dsv",
			"Scala.par-invalids.dsv",
			"Scala.standard-invalids.dsv",
			"Java.JSR-303.dsv",
			"Scala.par.dsv",
			"Scala.standard.dsv"
		];

	var gets = files.map(function(f) {
		return $.get(prefix + f);
	});

	var ctx = document.getElementById("chart").getContext("2d");

	$.when.apply($, gets).done(function(){
		var d = $(arguments).map(function(i, e){
			var p = $.parse(e[0]);
			console.log(p.results.rows.map(function(r){ return r['param-size'] }))
			return {
				fillColor : "rgba(230, 117, 61, .1)",
				strokeColor : "rgba(230, 117, 61, 1)",
				pointColor : "rgba(230, 117, 61, 1)",
				pointStrokeColor : "#fff",
				data: p.results.rows.map(function(r){ return r['value'] })
			}

		});

		var data = {
			labels: [5000, 6000, 7000, 8000, 9000, 10000],
			datasets: d
		}

		new Chart(ctx).Line(data, {
			scaleOverlay: true,
			bezierCurve: false
		});

	});

	// $.get("/assets/scala_is_faster_than_java/Scala.standard.dsv", function(csv) {
	// 	var c = $.parse(csv),
	// 		ctx = document.getElementById("chart").getContext("2d"),
	// 		data = {
	// 			labels: c.results.rows.map(function(r){ return r['param-size'] }),
	// 			datasets: [
	// 				{
	// 					fillColor : "rgba(230, 117, 61, .1)",
	// 					strokeColor : "rgba(230, 117, 61, 1)",
	// 					pointColor : "rgba(230, 117, 61, 1)",
	// 					pointStrokeColor : "#fff",
	// 					data: c.results.rows.map(function(r){ return r['value'] })
	// 				}
	// 			]
	// 		};
	// 	console.log(data)
	// 	new Chart(ctx).Line(data, {
	// 		scaleOverlay: true,
	// 		bezierCurve: false
	// 	});
	// })
</script>

