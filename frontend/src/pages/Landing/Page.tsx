import AmazingSuggest from "./components/AmazingSuggest/AmazingSuggest"
import Baners from "./components/Baners/Baners"
import BestSeller from "./components/BestSeller/BestSeller"
import Blogs from "./components/Blogs/Blogs"
import Brands from "./components/Brands/Brands"
import Categories from "./components/Categories/Categories"
import Latest from "./components/Latest/Latest"
import Slider from "./components/Slider/Slider"
import Stories from "./components/Stories/Stories"

function Landing() {
  return (
    <div>
      <div>
        <Slider />
      </div>
      <div className="container">
        <div>
          <Stories />
        </div>
        <div>
          <AmazingSuggest />
        </div>
        <div>
          <Baners />
        </div>
        <div>
          <Categories />
        </div>
        <div>
          <Latest />
        </div>
        <div>
          <BestSeller />
        </div>
        <div>
          <Brands />
        </div>
        <div>
          <Blogs />
        </div>
      </div>
    </div>
  )
}

export default Landing