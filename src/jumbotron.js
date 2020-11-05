export default class Jumbotron {
  constructor(element) {
    this.element = element;
  }

  init() {
    this.element.innerHTML = `<div class="jumbotron jumbotron-fluid bg-dark">
                                <div class="container-xl">
                                  <div class="row">
                                    <div class="col-md-10 col-lg-8 mx-auto text-white">
                                        <h1 class="display-3">RSS Reader</h1>
                                        <p class="lead">Start reading RSS today! It is easy, it is nicely.</p>
                                        <form action="" class="rss-form"><div class="form-row"><div class="col"><input autofocus="" required="" name="url" aria-label="url" class="form-control form-control-lg w-100" placeholder="RSS link"></div><div class="col-auto"><button type="submit" aria-label="add" class="btn btn-lg btn-primary px-sm-5">Add</button></div></div></form>
                                        <p class="text-muted my-1">Example: https://ru.hexlet.io/lessons.rss</p>
                                        <div class="feedback text-danger"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="container-xl">
                                <div class="row">
                                  <div class="col-md-10 col-lg-8 mx-auto feeds"></div>
                                </div>
                                <div class="row">
                                  <div class="col-md-10 col-lg-8 mx-auto posts"></div>
                                </div>
                              </div>`;
  }
}
