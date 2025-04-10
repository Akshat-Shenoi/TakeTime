/* eslint-disable */
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const axios = require("axios");

initializeApp();

exports.generateTakeTimeTakes = onRequest(
	{
		// Allow public (unauthenticated) access.
		serviceConfig: {
		  invoker: ["allUsers"],
		},
	  },
	async (req, res) => {
  try {
    const topics =  new Map([
			["sports", [
					"NFL",
					"College Football",
					"MLB",
					"College Baseball",
					"Tennis",
					"NBA",
					"College Basketball",
					"MMA",
					"Golf",
					"Cricket",
					"Ice Hockey",
					"Rugby",
					"Boxing",
					"Mixed Martial Arts",
					"F1",
					"Soccer",
					"Swimming",
					"Olympics",
					"Pickleball"]],
			 ["entertainment", [
					 "Movies",
					 "TV Shows",
					 "Movie Recommendations",
					 "Show Recommendations",
					 "Video Games",
					 "Music",
					 "Books",
					 "Podcasts",
					 "Social Media",
					 "Web Series",
					 "Web Comics",
					 "Anime",
					 "Video Clips",
					 "Short Films",
					 "Documentaries",
					 "Reality TV"]],
			["educational", [
					"Computer Science",
					"Artificial Intelligence",
					"Math",
					"Environment",
					"Health & Fitness",
					"History",
					"Economics",
					"Chemistry",
					"Physics",
					"Biology",
					"Psychology",
					"Literature",
					"Philosophy",
					"Foreign Language",
					"Test Preparation",
					"Study Strategies",
					"Engineering",
					"Art",
					"Finance"]],
			["news", [
					"Politics",
					"Business",
					"Technology",
					"Science",
					"World Events",
					"Entertainment",
					"Health",
					"Climate",
					"Space",
					"Sports",
					"Crime",
					"Education",
					"Culture",
					"Stock Market",
					"Animals",
					"Positive Stories"]],
			["lifestyle", [
					"Fashion",
					"Beauty",
					"Travel",
					"Skincare",
					"Cooking",
					"Fitness",
					"Mental Health",
					"Finances",
					"Personal Development",
					"Home Decor",
					"Positivity",
					"Wellness",
					"Jewelry",
					"Home Inspiration",
					"Life Hacks",
					"Work-Life Balance",
					"Productivity",
					"Minimalism"]],
			["arts", [
					"Music",
					"Artwork",
					"Photography",
					"Writing",
					"Design",
					"Video Games",
					"Poetry",
					"Film",
					"Painting",
					"Crochet",
					"Drawing",
					"Editing",
					"Dance"]],
			["relationships", [
					"Dating",
					"Relationships",
					"Parenting",
					"Friendship",
					"Break Up",
					"Single Life",
					"Dating Advice",
					"Long Distance Relationships",
					"Dating Tips",
					"Relationship Goals",
					"Family",
					"Siblings",
					"New Parent",
					"General Relationship Advice",
					"Healthy Relationship",
					"Healthy Friendship",
					"Communication",
					"Trust Issues",
					"Love Languages",
					"Emotional Support"]],
			["other", [
					"Funny",
					"Jokes",
					"Life Advice",
					"Cute Pets",
					"Rant",
					"Conspiracy Theories",
					"Remember When",
					"Advice",
					"Random Thoughts",
					"Motivational Quotes"]]
	 ]);

    const db = getFirestore();

    // Clear the "TakeTime" collection by deleting all documents in a batch.
    const snapshot = await db.collection("TakeTime").get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    // Retrieve the OpenAI API key from the Firestore document "KEYS/OpenAI".
    const configDoc = await db.collection("KEYS").doc("OpenAI").get();
    if (!configDoc.exists) {
      throw new Error("OpenAI configuration document not found in Firestore");
    }
    const apiKey = configDoc.data().key;

    // Generate an array of 5 random topics.
    // For each, randomly choose one category key and then randomly choose one topic from that category.
    const categoryKeys = Array.from(topics.keys());
    const randomTopics = [];
    for (let i = 0; i < 5; i++) {
      // Pick a random key from the keys array
      const randomKey =
        categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
      // Get the array of topics for that key
      const topicArray = topics.get(randomKey);
      // Pick a random topic from that array
      const randomTopic =
        topicArray[Math.floor(Math.random() * topicArray.length)];
      randomTopics.push([randomKey, randomTopic]);
    }


    // For each randomly selected topic, generate a take using OpenAI's API.
    for (const topic of randomTopics) {
      const prompt = `Generate a hot take on this topic: "${topic[1]}", for a social media app that users can vote yes or no on.`;

      const response = await axios.post(
		"https://api.openai.com/v1/chat/completions",
		{
		  model: "gpt-3.5-turbo", // New recommended model.
		  messages: [
			{
			  role: "system",
			  content: "You are an assistant that generates exciting, discussion provoking hot takes on popular recent topics. Your takes should be concise and witty."
			},
			{
			  role: "user",
			  content: prompt
			}
		  ],
		  max_tokens: 100,
		  temperature: 0.7
		},
		{
		  headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		  },
		}
	  );

      const generatedTake = response.data.choices[0].message.content.trim();

      // Save the generated take to the "TakeTime" collection.
      await db.collection("TakeTime").add({
        take: generatedTake,
				category: topic[0],
        topic: topic[1],
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    console.log("Takes generated successfully.");
    res.status(200).send("Takes generated successfully.");
    return;
  } catch (error) {
    console.error("Error generating takes:", error);
    res.status(500).send("Error generating takes");
    return;
  }
}
);
