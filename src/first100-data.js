const slugify = value => String(value)
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const makeShelf = (id, title, icon, color, terms) => ({
  id,
  title,
  icon,
  color,
  words: terms.map(word => ({ word, slug: `${id}-${slugify(word)}` })),
});

export const first100Shelves = [
  makeShelf('animals', 'Animals and Birds', '🦁', '#F39A55', [
    'Dog', 'Cat', 'Puppy', 'Kitten', 'Cow', 'Calf', 'Horse', 'Pony', 'Pig', 'Goat',
    'Sheep', 'Lamb', 'Chicken', 'Rooster', 'Duck', 'Goose', 'Turkey', 'Rabbit', 'Mouse', 'Rat',
    'Hamster', 'Guinea Pig', 'Squirrel', 'Chipmunk', 'Deer', 'Moose', 'Fox', 'Wolf', 'Bear', 'Panda',
    'Koala', 'Kangaroo', 'Monkey', 'Gorilla', 'Chimpanzee', 'Lion', 'Tiger', 'Leopard', 'Cheetah', 'Elephant',
    'Giraffe', 'Zebra', 'Rhinoceros', 'Hippopotamus', 'Camel', 'Llama', 'Alpaca', 'Sloth', 'Raccoon', 'Skunk',
    'Otter', 'Beaver', 'Hedgehog', 'Bat', 'Owl', 'Eagle', 'Hawk', 'Parrot', 'Flamingo', 'Peacock',
    'Penguin', 'Swan', 'Sparrow', 'Robin', 'Crow', 'Hummingbird', 'Woodpecker', 'Ostrich', 'Crocodile', 'Alligator',
    'Turtle', 'Tortoise', 'Snake', 'Lizard', 'Frog', 'Toad', 'Fish', 'Shark', 'Whale', 'Dolphin',
    'Octopus', 'Squid', 'Crab', 'Lobster', 'Seahorse', 'Starfish', 'Jellyfish', 'Snail', 'Ant', 'Bee',
    'Butterfly', 'Ladybug', 'Grasshopper', 'Caterpillar', 'Spider', 'Worm', 'Dragonfly', 'Beetle', 'Moth', 'Firefly',
  ]),
  makeShelf('food', 'Food We Eat', '🍎', '#71B96B', [
    'Apple', 'Banana', 'Orange', 'Pear', 'Peach', 'Plum', 'Mango', 'Papaya', 'Pineapple', 'Watermelon',
    'Strawberry', 'Blueberry', 'Raspberry', 'Cherry', 'Grape', 'Kiwi', 'Pomegranate', 'Coconut', 'Lemon', 'Lime',
    'Avocado', 'Guava', 'Fig', 'Apricot', 'Cantaloupe', 'Carrot', 'Potato', 'Tomato', 'Onion', 'Cucumber',
    'Broccoli', 'Cauliflower', 'Cabbage', 'Spinach', 'Lettuce', 'Pea', 'Corn', 'Pumpkin', 'Bell Pepper', 'Mushroom',
    'Eggplant', 'Zucchini', 'Radish', 'Beetroot', 'Celery', 'Green Bean', 'Sweet Potato', 'Okra', 'Asparagus', 'Garlic',
    'Rice', 'Bread', 'Pasta', 'Noodle', 'Oatmeal', 'Cereal', 'Flour', 'Tortilla', 'Bagel', 'Pancake',
    'Waffle', 'Cracker', 'Pretzel', 'Popcorn', 'Granola', 'Quinoa', 'Couscous', 'Millet', 'Barley', 'Toast',
    'Milk', 'Cheese', 'Yogurt', 'Butter', 'Egg', 'Tofu', 'Lentil', 'Chickpea', 'Kidney Bean', 'Peanut',
    'Almond', 'Cashew', 'Walnut', 'Raisin', 'Soup', 'Salad', 'Sandwich', 'Pizza', 'Taco', 'Dosa',
    'Idli', 'Porridge', 'Jam', 'Honey', 'Cookie', 'Cupcake', 'Chocolate', 'Ice Cream', 'Smoothie', 'Juice',
  ]),
  makeShelf('concepts', 'Numbers, Colors and Shapes', '🔷', '#6C9EEB', [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    'Red', 'Blue', 'Yellow', 'Green', 'Orange Color', 'Purple', 'Pink', 'Brown', 'Black', 'White',
    'Gray', 'Gold', 'Silver', 'Turquoise', 'Beige', 'Circle', 'Square', 'Triangle', 'Rectangle', 'Oval',
    'Star', 'Heart', 'Diamond', 'Crescent', 'Pentagon', 'Hexagon', 'Octagon', 'Cube', 'Sphere', 'Cylinder',
    'Big', 'Small', 'Tall', 'Short', 'Long', 'Wide', 'Narrow', 'Thick', 'Thin', 'Heavy',
    'Light', 'Full', 'Empty', 'Open', 'Closed', 'Same', 'Different', 'More', 'Less', 'Many',
    'Few', 'First', 'Last', 'Top', 'Bottom', 'Middle', 'Inside', 'Outside', 'Above', 'Below',
    'Over', 'Under', 'In Front', 'Behind', 'Near', 'Far', 'Left', 'Right', 'Up', 'Down',
    'Fast', 'Slow', 'Hot', 'Cold', 'Wet', 'Dry', 'Soft', 'Hard', 'Day', 'Night',
  ]),
  makeShelf('moving', 'Things That Move', '🚗', '#E95F78', [
    'Car', 'Bus', 'School Bus', 'Taxi', 'Truck', 'Pickup Truck', 'Van', 'Jeep', 'Ambulance', 'Fire Engine',
    'Police Car', 'Garbage Truck', 'Dump Truck', 'Tow Truck', 'Cement Mixer', 'Tractor', 'Bulldozer', 'Excavator', 'Crane', 'Forklift',
    'Motorcycle', 'Scooter', 'Bicycle', 'Tricycle', 'Skateboard', 'Roller Skates', 'Wheelchair', 'Stroller', 'Wagon', 'Shopping Cart',
    'Train', 'Steam Train', 'Subway', 'Tram', 'Monorail', 'Cable Car', 'Bullet Train', 'Freight Train', 'Passenger Train', 'Locomotive',
    'Airplane', 'Jet', 'Helicopter', 'Glider', 'Hot-Air Balloon', 'Rocket', 'Space Shuttle', 'Seaplane', 'Parachute', 'Drone',
    'Boat', 'Sailboat', 'Speedboat', 'Canoe', 'Kayak', 'Rowboat', 'Ferry', 'Ship', 'Cruise Ship', 'Submarine',
    'Raft', 'Gondola', 'Yacht', 'Tugboat', 'Lifeboat', 'Surfboard', 'Snowmobile', 'Sled', 'Ski', 'Snowboard',
    'Elevator', 'Escalator', 'Moving Walkway', 'Ferris Wheel', 'Roller Coaster', 'Carousel', 'Bumper Car', 'Go-Kart', 'Zip Line', 'Chairlift',
    'Unicycle', 'Rickshaw', 'Auto Rickshaw', 'Camper', 'Caravan', 'Motorhome', 'Delivery Truck', 'Mail Truck', 'Food Truck', 'Street Sweeper',
    'Combine Harvester', 'Backhoe', 'Road Roller', 'Segway', 'Moped', 'ATV', 'Snowplow', 'Container Ship', 'Fishing Boat', 'Airship',
  ]),
  makeShelf('words', 'My First Words', '🌟', '#A77BDC', [
    'Baby', 'Girl', 'Boy', 'Mother', 'Father', 'Sister', 'Brother', 'Grandmother', 'Grandfather', 'Family',
    'Friend', 'Teacher', 'Doctor', 'Farmer', 'Firefighter', 'Chef', 'Head', 'Hair', 'Face', 'Eye',
    'Ear', 'Nose', 'Mouth', 'Teeth', 'Tongue', 'Hand', 'Finger', 'Arm', 'Leg', 'Foot',
    'Toe', 'Tummy', 'Shirt', 'Pants', 'Dress', 'Skirt', 'Sock', 'Shoe', 'Hat', 'Coat',
    'Glove', 'Scarf', 'Pajamas', 'Diaper', 'House', 'Door', 'Window', 'Roof', 'Room', 'Bed',
    'Pillow', 'Blanket', 'Chair', 'Table', 'Sofa', 'Lamp', 'Clock', 'Mirror', 'Cup', 'Plate',
    'Bowl', 'Spoon', 'Fork', 'Bottle', 'Towel', 'Soap', 'Toothbrush', 'Comb', 'Book', 'Paper',
    'Pencil', 'Crayon', 'Ball', 'Doll', 'Blocks', 'Puzzle', 'Kite', 'Drum', 'Teddy Bear', 'Toy',
    'Sun', 'Moon', 'Cloud', 'Rain', 'Rainbow', 'Tree', 'Flower', 'Leaf', 'Grass', 'Rock',
    'Sand', 'Water', 'River', 'Mountain', 'Beach', 'Garden', 'Playground', 'Park', 'School', 'Library',
  ]),
];

