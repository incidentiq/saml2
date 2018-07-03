/*
This file in the main entry point for defining Gulp tasks and using Gulp plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkId=518007
*/

var gulp = require('gulp'),
	util = require('gulp-util'),
	exec = require('child_process').exec,
	fs = require("fs"),
	msbuild = require("gulp-msbuild"),
	replace = require('gulp-replace');


var gulpBuild = function(configuration)
{
	return new Promise(function(resolve, reject)
	{
		gulp.src("./SAML2.Core.csproj")
			.pipe(msbuild(
				{
					targets: ['Rebuild'],
					properties:
						{
							Configuration: configuration,
							VisualStudioVersion: "15.0",
						},
					toolsVersion: "auto",
					stdout: false,
					stderr: true,
					errorOnFail: true,
					emitEndEvent: true
				}))
			.on('end', resolve).on('error', reject);

		//resolve();
	});

};

var gulpIncrementVersion = function(configuration)
{
	return new Promise(function(resolve, reject)
	{
		if (configuration == "Debug")
		{
			gulp.src("./Properties/AssemblyInfo.cs")
				.pipe(replace(/\[assembly:\s+AssemblyInformationalVersion\(\"([0-9]+)\.([0-9]+)\.([0-9]+)-(\w+)\"\)\]/gim, function(match, p1, p2, p3, p4, offset, string) 
				{
					var major = p1;
					var minor = p2;
					var build = parseInt(p3) + 1;

					var configuration = p4;

					return '[assembly: AssemblyInformationalVersion("'+major+'.'+minor+'.'+build+'-'+configuration+'")]'
				}))
				.pipe(gulp.dest('./Properties'))
				.on('end', resolve).on('error', reject);

		}

		else if (configuration == "Release")
		{
			gulp.src("./Properties/AssemblyInfo.cs")
				.pipe(replace(/\[assembly:\s+AssemblyVersion\(\"([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)\"\)\]/gim, function(match, p1, p2, p3, p4, offset, string) 
				{
					var major = p1;
					var minor = p2;

					var dt = new Date();
					var y = dt.getFullYear();
					var m = dt.getMonth() + 1;
					var d = dt.getDate();
					var date = (y%2000)*1000 + (--m*31-(m>1?(1054267675>>m*3-6&7)-(y&3||!(y%25)&&y&15?0:1):0)+d);
					var build = (dt.getUTCHours()*60+dt.getUTCMinutes());
					

					return '[assembly: AssemblyVersion("'+major+'.'+minor+'.'+date+'.'+build+'")]'
				}))
				.pipe(gulp.dest('./Properties'))
				.on('end', resolve).on('error', reject);

		}

		//resolve();
	});

};

var gulpNugetPack = function(configuration, isSymbols)
{
	return new Promise(function (resolve, reject)
	{
		var projectPath = process.cwd();
		var specPath = ".\\Spark.SAML2.Core.nuspec"; //projectPath + ".\\Spark.App.Framework.nuspec";
		var outputFolder = "bin/nuget";
		var outputPath = projectPath + "\\bin\\nuget";
		var symbolsFlag = isSymbols ? " -Symbols " : "";

		//clear files
		var files = fs.readdirSync(outputPath);
		for (var file of files) { fs.unlinkSync(outputPath + "\\" + file); }

		//normal
		exec(projectPath + "\\..\\..\\tools\\nuget.exe pack SAML2.Core.csproj -Properties Configuration=" + configuration + " " + symbolsFlag + " -Build -IncludeReferencedProjects -OutputDirectory \"" + outputFolder + "\"", { cwd: projectPath, }, function(error, stdout, stderr)
		{
			if (error) console.log(error);
			if (stdout) console.log(stdout);

			resolve();
		});

	});

};

//gulp.task("nuget:pack-debug", function() { return gulpNugetPack("Debug"); });
//gulp.task("nuget:pack-release", function() { return gulpNugetPack("Release"); });

var gulpNugetPush = function(configuration)
{
	return new Promise(function (resolve, reject)
	{
		var projectPath = process.cwd();
		var path = process.cwd() + "\\..\\..\\tools\\";
		var outputFolder = "bin/nuget";
		var outputPath = projectPath + "\\bin\\nuget";

		var files = fs.readdirSync(outputPath);

		console.log("Pushing: " + files[0]);
		exec(path + "nuget.exe push -Source http://nuget.iqapps.io/api/v2/package -ApiKey AQ9RmEq67dW7Fu3zFUAKx6M " + "bin/nuget/" + files[0], { cwd: projectPath, }, function(error, stdout, stderr)
		{
			if (error) console.log(error);
			if (stdout) console.log(stdout);

			if (files.length < 2)
			{
				resolve();
				return;
			}

			//In case there is separate symbols package, upload
			console.log("Pushing: " + files[1]);
			exec(path + "nuget.exe push -Source http://nuget.iqapps.io/api/v2/package -ApiKey AQ9RmEq67dW7Fu3zFUAKx6M " + "bin/nuget/" + files[1], { cwd: projectPath, }, function (error, stdout, stderr)
			{
				if (error) console.log(error);
				if (stdout) console.log(stdout);

				resolve();
			});
			
		});


	});

};

var gulpNugetPushSymbols = function(configuration)
{
	return new Promise(function (resolve, reject)
	{
		var projectPath = process.cwd();
		var path = process.cwd() + "\\..\\..\\tools\\";
		var outputFolder = "bin/nuget";
		var outputPath = projectPath + "\\bin\\nuget";

		var files = fs.readdirSync(outputPath);
		exec(path + "nuget.exe push -source https://nuget.smbsrc.net bin/nuget/" + files[1], { cwd: projectPath, }, function(error, stdout, stderr)
		{
			if (error) console.log(error);
			if (stdout) console.log(stdout);

			resolve();
		});
		
	});

};

/*
gulp.task("nuget-debug", function ()
{
	var configuration = "Debug";

	return gulpIncrementVersion(configuration)
				.then(function() { return gulpBuild(configuration); })
				.then(function() { return gulpNugetPack(configuration, false); })
				//.then(function() { return gulpNugetPack(configuration, true); })
				.then(function() { return gulpNugetPush(configuration); })
				//.then(function() { return gulpNugetPushSymbols(configuration); });
});
*/
gulp.task("nuget-release", function ()
{
	var configuration = "Release";

	return gulpIncrementVersion(configuration)
				.then(function() { return gulpBuild(configuration); })
				.then(function() { return gulpNugetPack(configuration, false); })
				//.then(function() { return gulpNugetPack(configuration, true); })
				.then(function() { return gulpNugetPush(configuration); })
				//.then(function() { return gulpNugetPushSymbols(configuration); });
});
