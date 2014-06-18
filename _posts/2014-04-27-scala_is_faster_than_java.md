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

One of the very common problem in programming is data validation. In a word, we want to make sure that every incoming data has the correct structure. We need to discriminate unsafe external inputs from safe, compiler validated data. In a typical web application, you need do that on every request. Surely, it could have an impact on the performances of your application. In this article, I'm going to compare two extremely different solutions addressing the issue. The Bean validation API from Java, and the unified validation API from play. The latter being a more functional approach, featuring immutability and typesafety.

### Java: The Bean Validation API, aka JSR 303

The bean validation [specification](https://jcp.org/en/jsr/detail?id=303) was first released in 2009. This API uses annotations to set constraints on *Java Beans*. You then call the validation method on an annotated instance to find out if its valid. The reference, and most popular implementation is from [Hibernate](http://hibernate.org/validator/).

Here's a little example from their website:

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=1_example.java"></script>

That's for the declaration. The actual validation looks like this (again, from their website):

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=2_example2.java"></script>

So you pass an instance to `validator.validate` and you get a `Set` of errors. If the Set is empty, the object was valid.

Most of the time, you'll use this API to validate Json or XML. Here's how you'd unmarshall and validate a json object:

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=3b_json.java"></script>

### Scala: Play unified validation API.

[The unified validation API](https://github.com/jto/validation) is an effort to provide the core primitives needed to validate any data structure. Its primary intent is to replace the Json validation API and the form validation API in play framework. It's easy to extend, and support Json validation, and form validation out of the box.

Here's a port of the Json validation scenario. Note that this time, we are validating the Json directly.

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=3_example.scala"></script>

When implementing the API, I didn't focus much on performances. My primary objectives were correctness, compositionality, and typesafety. Actually some design choices, like making every validator lazily evaluated, have a negative impact on performances. Let's see how it performs.

## Benchmark

### The test protocol

The benchmark consists of parsing and validating Json objects stored in a file. The data are extracted from [the Last.fm Dataset](http://labrosa.ee.columbia.edu/millionsong/lastfm). The JSON structure has been modified a bit for easier parsing (using the awesome [jq](http://stedolan.github.io/jq/)). The code is hosted [here](https://github.com/jto/validation-bench).

The performances are measured using a series of scalameter micro-benchmarks. Both APIs are using Jackson for parsing JSON.

### Results

The benchmark measures the time taken to parse and validate from 5000 to 10000 json objects.
Two different scenario are tested:

- All the objects are valid
- All the objects have an invalid field

Here are the results. A lower execution time is better.

<div id="chart" class="chart"></div>

Surprisingly, the Scala API is a lot faster!

- When the objects are valid, **the Scala API is up 1.6x faster** than the Java API.
- When the objects contains an invalid field, **the Scala API is up 2.6x faster** than the Java API.

The Scala API is significantly faster than the Java API. Having invalid fields will greatly affect performances in the Java API, while it has little impact on the Scala side.


## Benchmarks are unimportant

So what do we learn there ?

We learn that in this particular setup, a particular library written in Scala is faster than a particular library written in Java.
It certainly does not mean that a Java program is always going to be slower than the same program written in Scala.

Since the beginning of Scala, we've seen *a lot* of people wondering [if Scala is slower than Java](https://www.google.fr/search?q=scala+is+too+slow&oq=scala+is+slo&aqs=chrome.2.69i57j0l5.3709j0j7&sourceid=chrome&es_sm=91&ie=UTF-8#q=java%20vs%20scala%20benchmark).

Benchmarks are getting a lot of attention, [This one](http://www.techempower.com/benchmarks/) in particular. It demonstrates that a web app sending json responses written using `cpoll_cppsp` is 4 times faster than in `nodejs` app, which "only" sends 228,887 responses per-second.

I write web applications for a living. I even contribute code to a web framework. Is that relevant to me ?

**Not really**. A benchmark is never going to come close to what a real production application does. 228,887 responses per-seconds on a single node is, by an order of magnitude, more than any real application figures.

So why do I take the time to write my own benchmark you may ask? I was expecting the unified API to outperform Java, and wanted to prove that. Contrary to popular beliefs, a Scala program can be faster than its Java counterpart.

The interesting question is: Why is it faster while relying on a "slow" language ? The answer is actually quite simple. A better, more scalable language provides better tools to write better programs.

It does not matter if Java kills Scala on micro-benchmarks. Because Java lacks essential constructs, it forces you to rely on workarounds like using reflection.
Those workarounds not only hurt the performances of your application, but more importantly, they're making your program harder to reason about.

## A case for correctness compositionality, and user-friendliness.

### Java's problems

#### Unfriendly  API

The main problem I have with Java's validation API, (actually with Java in general) is it's unnecessary complexity.
Sure for trivial use-cases it looks nice and simple, but as soon as you start to dig into it, things get funny:

Let's see a simple example, what if we use JSR-303 on an instance of Track:

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=4_correctness.java"></script>

Surely, that's enough to check that a given track instance is valid?

__WRONG__. You see, we didn't state explicitly that when verifying the validity of a `Track`, we must also check the validity of its `Tags` and `Similars`. You need to annotate each attribute with `@Valid`.

That behavior is extremely counter-intuitive. I fail to see how a `Track` instance can be valid if its members aren't.

#### Validation and unmarshalling

JSR 303 does not handle data marshalling and unmarshalling. It's only about class instances validation. For the purpose of this test, I used Jackson to unmarshall the Json into class instances. The thing is, validation is part of unmarshalling. One can't simply transform a JSON tree in a class instance without checking the Json structure beforehand. Does the "age" field I'm expecting exists ? Is it an integer ?

Considering that point, the Java workflow seems very odd. When parsing Json you actually have to handle 3 types of errors:

- The Json is not well-formed
- The Json is valid but does not match the structure you're expecting (ie: a field is missing, has the wrong type, etc).
- The constraints you defined are not satisfied.

JSR-303 only helps you with the latter.

The API also forces you to work directly with potentially "invalid" instances. I'd argue that if a class instance is invalid, you should not have created it in the first place

#### Hard to extend API

Hibernate Validator comes with a handful of built-in validation rules (Email, Length, NotBlank, etc...).

What if you need create a new validation constraint (example from hibernate's doc)?

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=5_extend.java"></script>

That's approximately 25 lines of code. 21 are pure ceremony. The only interesting part is:

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=6_extend_simple.java"></script>

How do we implement the same thing using the unified validation API ?

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=7_extend.scala"></script>

Yep, that's 6 lines of codes. I'm confident anybody can grasp it.

Now, what if I have a `min` rule, a `max` rule, and I want to create a `between` rule ? That's easy. Rules compose.

<script src="https://gist.github.com/jto/5ec094ab4fd40f699b88.js?file=8_compose.scala"></script>

And in java ? Well, I don't even feel like writing that code. It would just be long and tedious.


## Scala bonus: Easy parallelism

As a little bonus, since the Scala API only uses immutable data structure, it's completely Thread safe. Scala provides parallels collections.
Hacking my original code for 5 minutes, I came up with a version using my multi-core processor to it's fullest.

<div id="chart2" class="chart"></div>

This version is 5x faster than the Java one.

## Conclusion

I think the point of this post is rather obvious. When it comes to choosing a library or a language, benchmarks are rather unhelpful. A properly implemented algorithm can always be optimized. A broken implementation is just broken.

This particular example proves that even though Scala has some overhead, its superior design makes it possible to create libraries that are not only easier to reason about, but also have better performances than their Java counterparts.

You can learn more about the unified API by reading [this post](http://jto.github.io/articles/play_new_validation_api/) or by checking out the [source code](https://github.com/jto/validation).

<script src="//code.jquery.com/jquery-1.9.1.min.js" type="text/javascript" charset="utf-8"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min.js" type="text/javascript" charset="utf-8"></script>
<!-- <script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/Chart.js/0.2.0/Chart.min.js"></script> -->
<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/highcharts/4.0.1/highcharts.js"></script>
<script src="/assets/js/jquery.parse.min.js" type="text/javascript" charset="utf-8"></script>
<style>
	.chart {
		display: block;
		height: 600px;
		width: 500px;
		margin: 0 auto;
	}
</style>

<script type="text/javascript">
	var prefix = "/assets/scala_is_faster_than_java/",
		files = [
			"Java.JSR-303-invalids.dsv",
			"Java.JSR-303.dsv",
			"Scala.standard-invalids.dsv",
			"Scala.standard.dsv",
			"Scala.par-invalids.dsv",
			"Scala.par.dsv"
		];

	var gets = files.map(function(f) {
		return $.get(prefix + f);
	});


	var colors = [
		"rgba(230, 117, 61, 1)",
		"rgba(230, 117, 61, .5)",
		"rgba(27, 187, 201, 1)",
		"rgba(27, 187, 201, .5)",
		"rgba(140, 215, 209, 1)",
		"rgba(140, 215, 209, .5)"];

	var names = [
		"Hibernate validator - invalids",
		"Hibernate validator",
		"Unified - invalids",
		"Unified ",
		"Unified w/ par - invalids",
		"Unified w/ par"]


	$.when.apply($, gets).done(function(){
		var ds = _.map(_.zip(arguments, names), function(arg){
			var res = arg[0],
				p = $.parse(res[0]),
				name = arg[1];

			return {
				name: name,
				data: p.results.rows.map(function(r){ return r['value'] })
			}
		});

		function draw(id, dataset, ti) {
			$(id).highcharts({
	      title: {
	        text: 'Validation APIs benchmarks',
	        x: -20 //center
	      },
	      colors: colors,
	      xAxis: {
	        categories: [5000, 6000, 7000, 8000, 9000, 10000]
	      },
	      yAxis: {
		      title: { text: 'Time (ms)' },
		      plotLines: [{
	          value: 0,
	          width: 1,
	          color: '#808080'
		      }]
	      },
	      tooltip: { enabled: false },
	      legend: {
	        layout: 'vertical',
	        align: 'right',
	        verticalAlign: 'middle',
	        borderWidth: 0,
	      },
	      series: dataset
		  });
		};

		draw('#chart2', ds);
		draw('#chart', _.take(ds, 4));

		console.log(colors)

	});



</script>

