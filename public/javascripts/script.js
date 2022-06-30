  

    function removeCartProduct(cartId,proId){

      swal({
          title: "Are you sure? You want to remove the product from cart",
          icon: "warning",
          buttons: true,
          dangerMode: true,
        })
          .then((willDelete) => {
            if (willDelete) {
    
    
    
            $.ajax(
                {
                    url: '/remove-cart-product',
                    data: {
                        cart: cartId,
                        product: proId,
                       
                    },
                    method: "POST",
                    success: (response) => {
                        if(response.removeCartProduct){
    
    
                        swal("Poof! Product deleted from cart!", {
                        icon: "success",
                      }).then(
                          ()=>{
                              location.reload()
                          }
                      )
    
    
    
                               
                        }
                   
    
                    }
                }
            )
            }
        })}
    
    
    
    
    //-----------------change quantity-----------------------------------------------------------------------
        function changeQuantity(cartId, proId,userId, count) {
            let quantity =parseInt(document.getElementById(proId).innerHTML)
               count=parseInt(count)
            $.ajax(
                {
                    url: '/change-product-quantity',
                    data: { 
                       
                        user:userId,
                        cart: cartId,
                        product: proId,
                        count: count,
                        quantity:quantity,
              
                      
                    },
                    method: "POST",
                    success: (response) => {
    
    
    
                        if (response.removeProduct) {
                        /*    console.log(response.status);
                            let count = ₹(`#₹{proId}`).html()
                            count = parseInt(count);
                            ₹(`#₹{proId}`).html(count) */
                           swal("Poof! Product deleted from cart!", {
                        icon: "success",
                      }).then(()=>{
                         location.reload()
                      });
                        }else{
                                       document.getElementById(proId).innerHTML=quantity+count
                                       document.getElementById('totalAmount').innerHTML = response.totalAmount
                              document.getElementById('subTotal').innerHTML = response.totalAmount
                        }             
    
    
                    }
                }
            )
    
        }
    




function addToCart(proId){
    console.log('-----------hhhhhhhhhhhhhhhh-----------------------');
    $.ajax({
        url:"/add-to-cart/"+proId,
        method:'get',
        success:(response)=>{
            // console.log('----------------------------------');
          if(response.loggedinstatus){
              location.href='/login'
          }else
         
      if(response.status){
        //   console.log(response.status);
          let count =$('#cart-count').html()
          count=parseInt(count)+1;
          swal("Poof! added to cart!", {
            icon: "success",
          })
          $('#cart-count').html(count)
        
      }

        
        }
    })
}

document.getElementById('img-container').addEventListener('mouseover', function(){
  imageZoom('featured')
  
})

function imageZoom(imgID){
let img = document.getElementById(imgID)
let lens = document.getElementById('lens')

lens.style.backgroundImage = `url( ${img.src} )`

let ratio = 1.5

lens.style.backgroundSize = (img.width * ratio) + 'px ' + (img.height * ratio) + 'px';

img.addEventListener("mousemove", moveLens)
lens.addEventListener("mousemove", moveLens)
img.addEventListener("touchmove", moveLens)

function moveLens(){
  /*
      Function sets sets position of lens over image and background image of lens
      1 - Get cursor position
      2 - Set top and left position using cursor position - lens width & height / 2
      3 - Set lens top/left positions based on cursor results
      4 - Set lens background position & invert
      5 - Set lens bounds
  
      */

      //1
  let pos = getCursor()
  //console.log('pos:', pos)

  //2
  let positionLeft = pos.x - (lens.offsetWidth / 2)
  let positionTop = pos.y - (lens.offsetHeight / 2)

  //5
  if(positionLeft < 0 ){
    positionLeft = 0
  }

  if(positionTop < 0 ){
    positionTop = 0
  }

  if(positionLeft > img.width - lens.offsetWidth /3 ){
    positionLeft = img.width - lens.offsetWidth /3
  }

  if(positionTop > img.height - lens.offsetHeight /3 ){
    positionTop = img.height - lens.offsetHeight /3
  }


  //3
  lens.style.left = positionLeft + 'px';
  lens.style.top = positionTop + 'px';

  //4
  lens.style.backgroundPosition = "-" + (pos.x * ratio) + 'px -' +  (pos.y * ratio) + 'px'
}

function getCursor(){
  /* Function gets position of mouse in dom and bounds
       of image to know where mouse is over image when moved
      
      1 - set "e" to window events
      2 - Get bounds of image
      3 - set x to position of mouse on image using pageX/pageY - bounds.left/bounds.top
      4- Return x and y coordinates for mouse position on image
      
       */

      let e = window.event
      let bounds = img.getBoundingClientRect()

      //console.log('e:', e)
      //console.log('bounds:', bounds)
      let x = e.pageX - bounds.left
  let y = e.pageY - bounds.top
  x = x - window.pageXOffset;
  y = y - window.pageYOffset;
  
  return {'x':x, 'y':y}
}

}

imageZoom('featured')