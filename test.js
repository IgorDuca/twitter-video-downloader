var string = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vitae magna sollicitudin, mollis tortor eget, rhoncus est. Ut imperdiet leo sed nisl faucibus, at porttitor mauris volutpat. Nam tincidunt vehicula libero ac ultrices. Ut tincidunt at urna ac bibendum. Nam sit amet aliquam massa. Aliquam facilisis sapien ac viverra sollicitudin. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean scelerisque sit amet nisi eget blandit. In eget ex vel turpis finibus dictum id eu lectus. Fusce viverra, arcu quis congue maximus, sem dui facilisis est, nec egestas lectus justo id mi. Integer lorem diam, volutpat et malesuada non, gravida a sem. Aliquam pharetra est eget diam maximus pulvinar. Etiam semper egestas justo, at luctus mi gravida nec. Aliquam sed ullamcorper massa. Nam fermentum pharetra lectus vitae cursus. Vivamus suscipit nunc in tellus euismod, sed pharetra diam ullamcorper. Sed et lacus tincidunt, sodales eros et, facilisis nunc. Vivamus vel mi fringilla odio cursus fermentum nec id ipsum. Vestibulum fringilla ut metus eu lacinia. Integer sagittis mattis quam. In sagittis, sapien at vulputate ultrices, sem eros laoreet libero, a egestas leo est a est. Etiam volutpat massa vel auctor mollis. Suspendisse eu mauris quam. Donec ut felis egestas, hendrerit turpis id, molestie eros. Donec sit amet nisi vitae magna dapibus lacinia eu in ipsum. Nulla suscipit augue tortor, in vulputate nisi malesuada ut. In posuere venenatis augue non fermentum. Proin luctus posuere lacus, non porta nibh porta consequat. Integer tempus congue rhoncus. Cras eu elit at orci porttitor mollis sed eget tellus. Duis scelerisque, mi ac pulvinar scelerisque, nisi eros maximus nulla, non rutrum nisi ligula sit amet magna. Pellentesque nec cursus dui. Integer in tortor eget massa fermentum tincidunt quis sit amet augue. Quisque viverra mi lacus, sit amet facilisis sapien hendrerit vel. Interdum et malesuada fames ac ante ipsum primis in faucibus. Cras sit amet tellus scelerisque, scelerisque est ut, hendrerit tellus. Curabitur erat elit, ultricies sit amet scelerisque id."

function chunkSubstr(str, size) {
  const numChunks = Math.ceil(str.length / size)
  const chunks = new Array(numChunks)

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size)
  }
  console.log(chunks)
}

chunkSubstr(string, 280)