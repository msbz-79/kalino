import Bottom from "./components/Bottom";
import Header from "./components/Header";
import Main from "./components/Main";

function Footer() {

  return (
    <div className="bg-lightSurfaceColor dark:bg-surfaceColor shadow-lightBoxShadow dark:shadow-darkBoxShadow mt-10">
      <div className="px-5 sm:px-10 lg:px-40">
        <Header />
        <Main />
        <Bottom />
      </div>
    </div>
  )
}

export default Footer