              -- AXON CLASSIC MODEL --
use classicmodels;
show tables;

-- 1.'customers table'
describe customers;
select * from customers;

-- Checking for the total number of Unique customers.
select count(distinct customerNumber) as total_customers from customers;

-- checking for null values 
select customerNumber from customers where customerNumber is null;


-- 2.'employees table'
describe employees;
select * from employees;

-- Checking for the total number of Unique employees.
select count(distinct employeeNumber) as Total_Employees from employees;

-- cheking the null values
select employeeNumber from employees where employeeNumber is null;


-- 3 'offices Table'
describe offices;
select * from offices;

-- Checking for the total number of Unique Offices.
select count(distinct officeCode) as Total_Offices from offices;

-- Offices by Country
select country , count(officeCode) as Total_Offices from offices 
group by country
order by Total_Offices desc;


-- 4 'Orderdetails Table'
describe Orderdetails;
select * from Orderdetails;

-- Total Number of Orders Received
select count(distinct orderNumber) as Total_Orders from orders;


-- 5 'Orders Table'
describe orders;
select * from orders;

-- Total Orders by Year and Month
select  year(orderDate) as Year,
MONTH(orderDate) AS Month,
monthname(orderDate) as Month_Name,
count(orderNumber) as Total_orders,
sum( count(orderNumber) ) over ( partition by Year(orderDate) order by MONTH(orderDate) asc) as Sum_Of_Orders
from orders
group by Year,Month,Month_Name
order by Year,Month asc;

-- Total Shipped Orders
select status, count(orderNumber) as Total_Orders 
from orders 
where status = 'Shipped';


-- 6. 'Payments Table'
describe payments;
select * from payments;

-- Total Amount Recived 
select sum(amount) Total_Amount from payments;

-- Total Amount paid by Customers
select customerNumber, sum(amount) as Total_Payment
from payments group by customerNumber;

-- Total Amount Recived by Year 
select year(paymentDate) as Year,
sum(amount) as Total_Amount,
sum(sum(amount)) over( order by Year(paymentDate)) as Sum_Of_Amount
from payments
group by Year
order by Year;

-- Total Amount Recived by Year and Month
select year(paymentDate) as Year,
monthname(paymentDate) as Month_Name,
sum(amount) as Total_Amount
from payments
group by Year,month(paymentDate),Month_Name 
order by Year,month(paymentDate),Month_Name ;


-- 7. 'Productlines Table'
describe productlines;
select  * from productlines;

-- Total Productlines
select count(distinct productLine) as total_productLine from productLines;


-- 8. 'products Table'
describe products;
select * from products;

-- Total Products
select count(distinct productCode) as Total_Products from products;

-- Total Products By Product Line
select productLine, count(productCode)as Total_Products
from products
group by productLine;

-- Quantity in stocks by Productline
select productLine , sum(quantityInStock) as Quantity_In_Stock from
products group by productLine;

-- Total Vendors 
select count(distinct productVendor) as Total_Vendors from products;


-- 1. Write a query to combine contactfirstname ,contactlastname as fullname.
Select Concat(contactfirstname," ",contactlastname) FullName from customers;

-- 2. Write a query to find highest customers from which country
select Country, Count(*) Total_Customers
from customers
group by country
order by Total_Customers desc
limit 1;

-- 3. Write a query to find highest customers from which city
select City, count(*) Total_Customers
from customers 
group by city
order by Total_Customers desc
limit 2;

-- 4. Write a query to find highest customers from which state 
select State, Count(*) Total_Customers
from customers
where state is not null
group by State
order by Total_Customers desc
limit 1;

-- 5. Write a query to list the customers who are not belongs to any state
select Customernumber,customername,city,country
from customers
where state is null;

-- 6. Write a query to find the customers having credit limit above 1,00,000 
select customernumber,customername 
from customers 
where creditlimit>100000;

-- 7. Write a query to find the customers having credit limit above 50,000 and below 2,00,000
select customernumber,customername
from customers
where creditlimit between 50000 and 200000;

-- 8. Write a query to find details of highest credit limit 
select customernumber,customername,creditlimit
from customers
where creditlimit=(select max(creditlimit) from customers);

-- 9. Write a query to find details of lowest credit limit 
select customernumber,customername,creditlimit
from customers
having creditlimit=(select min(creditlimit) from customers);

-- 10. Write a query to find number of customers for each sales representative
select employeenumber,concat(firstname," ",lastname) FullName,count(*) Total_customers
from customers c join employees e 
on c.salesrepemployeenumber = e.employeenumber
where salesrepemployeenumber is not null
group by 1
order by Total_customers desc;

-- 11. write a query to find employee for each customer
select customernumber,customername,concat(firstname," ",lastname) Employee_Name
from customers c join employees e 
on c.salesrepemployeenumber = e.employeenumber
where salesrepemployeenumber is not null;

-- 12. Write a query to list the customers and their country who dont have sales representative
select customernumber,customername,country,city
from customers
where salesRepEmployeeNumber is null;

-- 13. write a query to list the customer contactname having first name arnold or sarah
select customername,concat(contactfirstname," ",contactlastname) ContactName 
from customers 
where contactfirstname in ("arnold","sarah");

-- 14. Write a query to return the employeenumber who are reported to ,the number of employees that report to them.
select Reportsto,count(*) Employees
from employees
where reportsto is not null
group by reportsto
order by Employees desc;

-- 15. Write a query to find customer wise how many days taken between order date and shipment date
select customername,datediff(shippeddate,orderdate) Total_Days
from customers c join orders o
on c.customernumber=o.customernumber
where shippeddate is not null;

-- 16. Write a query to list the names of executives who are having VP or Manager
select employeenumber,concat(firstname," ",lastname) EmployeeName,jobtitle 
from employees
where jobtitle like "%VP%" or jobtitle like "%Manager%";

-- 17.Write a query to find each year how many orders are shipped
select year(shippeddate) Year,count(shippeddate) Total_shipped
from orders
where shippeddate is not null
group by year(shippeddate);

-- 18. Write a query to find number of orders placed by each customer
select customernumber,count(*) Total_Orders
from orders
group by customernumber
order by count(*) desc;

-- 19. Write a query to find number of products ordered by each vendor
select productvendor,count(distinct p.productcode) Total_Products,sum(quantityordered) Total_quantity,
sum(quantityordered*priceeach) Total_price from products p 
inner join orderdetails od on p.productcode=od.productcode
group by productvendor
order by Total_Products desc;

-- 20. Write a query to find total number of orders by each product.
select p.productcode,productname,sum(quantityordered) Total_quantity from products p 
inner join orderdetails od on p.productcode=od.productcode
group by p.productcode,productname
order by Total_quantity desc;

-- 21. Write a query to list all the products purchased by "Thomas Smith"
select p.productName,concat(c.contactFirstName,' ',c.contactLastName) as c_name from customers c 
inner join orders o on c.customernumber=o.customernumber
inner join orderdetails od on o.ordernumber=od.ordernumber
inner join products p on od.productcode=p.productcode
where Contactfirstname like "Thomas%";

-- 22. Write a query to pull the customers who buyed the highest number of products
select customername,concat(Contactfirstname," ",contactlastname) as Contact_Name,count(*) as Total_Products 
from customers c 
inner join orders o on c.customernumber=o.customernumber
inner join orderdetails od on o.ordernumber=od.ordernumber
inner join products p on od.productcode=p.productcode
group by customername,Contact_Name
order by Total_Products desc 
limit 1;

-- 23. Write a query to find which product has highest number of Customers
select p.Productcode,productname,count(*) Total_customers from  customers c 
inner join orders o on c.customernumber=o.customernumber
inner join orderdetails od on o.ordernumber=od.ordernumber
inner join products p on p.productcode=od.productcode
group by p.Productcode,productname
order by Total_customers desc
limit 1;

-- 24. write a query to find the customers with a amount larger than the average amount of all the coustomers
select c.customernumber,customername,amount  from customers c 
inner join payments p on c.customernumber=p.customernumber
inner join orders o on c.customernumber=o.customernumber
inner join orderdetails od on o.ordernumber=od.ordernumber
inner join products pr on pr.productcode=od.productcode
where amount>(select avg(amount) from payments)
group by c.customernumber,customername,amount;

-- 25.find customers,orders,total products of "On Hold" products
select status,o.customernumber,customername,od.ordernumber,count(productcode) Total_products,
sum(quantityordered*priceeach) Total_Price from orders o 
inner join payments p  on o.customernumber=p.customernumber
inner join orderdetails od on o.ordernumber=od.ordernumber
inner join customers c on p.customernumber=c.customernumber
where status ="On Hold"
group by status,o.customernumber,customername,od.ordernumber;

-- 26. write a query to show customers grouped by credit limit status, divided into three categorie and
	-- show the count of the customers in each group

select customerNumber,concat(contactFirstName,contactLastName) as Full_Name, creditlimit,
case 
	when creditLimit < 10000 then 'Low Credit Limit'
    when  creditLimit > 10000 and creditLimit < 75000 then 'Medium Credit Limit'
    when  creditLimit > 75000 then 'High Credit Limit'
    end as Customer_Credit_Status
from customers;


-- 27. Create a stored procedure that takes a customer's name as input and returns the total number of orders
delimiter $
create procedure Customer_Details(customer_name varchar(250)) 
begin
select o.customerNumber,c.customerName ,concat(e.firstName,' ',e.lastName) as Sales_Representative  ,
count(distinct o.orderNumber) as Total_Orders,
max(pd.productLine) as Product_Line
from customers c 
inner join orders o on o.customerNumber = c.customerNumber
inner join orderdetails od on od.orderNumber = o.orderNumber
inner join products pd on pd.productCode = od.productCode
inner join payments p on p.customerNumber = c.customerNumber
inner join employees e on e.employeeNumber = c.salesRepEmployeeNumber
where c.customerName = customer_name
group by o.customerNumber,c.customerName,Sales_Representative ,pd.productLine 
order by Total_Orders desc;
end $
delimiter ;

call Customer_Details('Euro+ Shopping Channel');


-- 28. create store procedure which takes Product Code name as input and 
	-- gives the total orders and total amount 

delimiter $
create procedure Product_Details(ProductCode varchar(20))
begin
select pd.productCode ,pd.productName, count(distinct od.orderNumber) as Total_Orders,
round( sum(od.quantityOrdered * od.priceEach) / 1000,2) as Total_Amount
from products pd 
inner join orderdetails od on pd.productCode = od.productCode
inner join orders o on o.orderNumber = od.orderNumber
where pd.productCode  = ProductCode
group by pd.productCode,pd.productName;
end $
delimiter ;

call Product_Details('S18_3232');